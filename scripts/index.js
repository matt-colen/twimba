import {
  ref,
  push,
  onValue,
  get,
  set,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { auth, database } from "./firebase-config.js";

const tweetsRef = ref(database, "tweets");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.querySelector("#sign-out-btn").classList.remove("hidden");
    currentUser = user;
    document
      .querySelectorAll("button")
      .forEach((button) => (button.disabled = false));
    document
      .querySelectorAll("textarea")
      .forEach((textarea) => (textarea.disabled = false));
  } else {
    document.querySelector("#sign-out-btn").classList.add("hidden");
    currentUser = null;
    document
      .querySelectorAll("button")
      .forEach((button) => (button.disabled = true));
    document
      .querySelectorAll("textarea")
      .forEach((textarea) => (textarea.disabled = true));
  }
  getWelcomeMessage(user);
});

const getWelcomeMessage = (user) => {
  document.querySelector("#status-message").innerHTML = user
    ? "Welcome back!"
    : `Please <a href="html/create-account.html">create an account</a> or <a href="html/login.html">log in</a> to continue`;
};

getWelcomeMessage();

const handleLogout = () => signOut(auth);

// Pulls initial data
get(tweetsRef, (snapshot) => {
  if (snapshot.exists) {
    render(snapshot.val());
  }
});

// Runs on changes to Firebase DB "tweets" ref
onValue(tweetsRef, (snapshot) => {
  if (snapshot.exists) {
    render(snapshot.val());
  }
});

const render = (data) => {
  const feed = document.getElementById("tweet-feed");
  data
    ? (feed.innerHTML = getFeedHTML(data))
    : (feed.innerHTML = `<p>No posts yet 😎</p>`);
};

const getFeedHTML = (jsonData) => {
  let tweets = Object.entries(jsonData).reverse();
  let feedHTML = ``;
  const currentUserID = currentUser ? currentUser.uid : null;

  tweets.forEach((tweet) => {
    const tweetVal = tweet[1];
    const replies = JSON.parse(tweetVal.replies);
    let repliesHTML = getRepliesHTML(replies);
    const isLiked = JSON.parse(tweetVal.likedBy.includes(currentUserID));
    const isRetweeted = JSON.parse(
      tweetVal.retweetedBy.includes(currentUserID)
    );

    feedHTML += `
    <div class="tweet" id="${tweet[0]}">
      <div class="tweet-inner">
        <img src="${tweetVal.profilePic}" class="profile-pic">
        <div>
            <p class="handle">${tweetVal.handle}</p>
            <p class="tweet-text">${tweetVal.tweetText}</p>
            <div class="tweet-details">
              <span class="tweet-detail">
                <i class="tweet-icon fa-regular fa-comment-dots"
                data-reply="${tweet[0]}"
                ></i>
                ${replies.length}
              </span>
              <span class="tweet-detail">
                <i class="tweet-icon fa-solid fa-heart ${
                  isLiked ? "liked" : ""
                }"
                data-like="${tweet[0]}"
                ></i>
                ${tweetVal.likes}
              </span>
              <span class="tweet-detail">
                <i class="tweet-icon fa-solid fa-retweet ${
                  isRetweeted ? "retweeted" : ""
                }"
                data-retweet="${tweet[0]}"
                ></i>
                ${tweetVal.retweets}
              </span>
            </div>
          </div>
        </div>
        <div class="hidden reply__container" id="replies-${tweet[0]}">
          
          <div class="reply-input__container">
            <textarea class="reply-text" type="text" placeholder="Add a reply"></textarea>
            <p id="reply-error" class="reply-error error hidden">Please enter a reply</p>
            <button id="reply-btn" class="btn btn--primary" data-reply-btn="${
              tweet[0]
            }">Reply</button>
          </div>

          ${repliesHTML}

        </div>
    </div>
    `;
  });
  return feedHTML;
};

const getRepliesHTML = (replies) => {
  let repliesHTML = "";
  if (replies.length > 0) {
    replies.forEach((reply) => {
      repliesHTML += `
      <div class="tweet-reply">
        <div class="tweet-inner">
          <img src="${reply.profilePic}" class="profile-pic">
          <div>
            <p class="handle">${reply.handle}</p>
            <p class="tweet-text">${reply.tweetText}</p>
          </div>
        </div>
      </div>
      `;
    });
  }
  return repliesHTML;
};

document.addEventListener("click", (e) => {
  if (currentUser) {
    if (e.target.dataset.like) {
      handleLikeClick(e.target.dataset.like);
    } else if (e.target.dataset.retweet) {
      handleRetweetClick(e.target.dataset.retweet);
    } else if (e.target.id === "tweet-btn") {
      handleTweetBtnClick();
    } else if (e.target.dataset.replyBtn) {
      handleReplyBtnClick(e.target.dataset.replyBtn);
    } else if (e.target.id === "sign-out-btn") {
      handleLogout();
    }
  }
  if (e.target.dataset.reply) {
    handleReplyClick(e.target.dataset.reply);
  }
});

const handleReplyBtnClick = async (tweetId) => {
  const tweetRef = ref(database, `tweets/${tweetId}`);
  const snapshot = await get(tweetRef);
  const replyText = document.querySelector(`#${tweetId} textarea`);
  const replyError = document.querySelector("#reply-error");

  if (replyText.value) {
    const replyObj = {
      handle: `@${auth.currentUser.displayName}`,
      profilePic: `../images/scrimbalogo.png`,
      tweetText: replyText.value,
      createdBy: `${auth.currentUser.uid}`,
    };

    if (snapshot.exists()) {
      const data = snapshot.val();
      let repliesArray = [];

      if (data.replies) {
        try {
          repliesArray = JSON.parse(data.replies);
        } catch (e) {
          console.error("Error parsing replies data", e);
          repliesArray = [];
        }
      }

      repliesArray.push(replyObj);
      repliesArray = repliesArray.reverse();
      data.replies = JSON.stringify(repliesArray);
      await set(tweetRef, data);
    }

    replyText.classList.remove("highlight");
    replyError.classList.add("hidden");
  } else {
    highlightInputField(replyText);
    replyError.classList.remove("hidden");
  }
};

const handleLikeClick = async (tweetId) => {
  const tweetRef = ref(database, `tweets/${tweetId}`);
  const currentUser = auth.currentUser.uid;

  const snapshot = await get(tweetRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    let likedByArray = [];

    if (data.likedBy) {
      try {
        likedByArray = JSON.parse(data.likedBy);
      } catch (parseError) {
        console.log("Error parsing likedBy data: ", parseError);
        likedByArray = [];
      }
    }

    if (!likedByArray.includes(currentUser)) {
      likedByArray.push(currentUser);
    } else {
      const index = likedByArray.indexOf(currentUser);
      likedByArray.splice(index, 1);
    }

    data.likes = likedByArray.length;
    data.likedBy = JSON.stringify(likedByArray);
    await set(tweetRef, data);
  }
};

const handleRetweetClick = async (tweetId) => {
  const tweetRef = ref(database, `tweets/${tweetId}`);
  const currentUser = auth.currentUser.uid;

  const snapshot = await get(tweetRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    let retweetedByArray = [];

    if (data.retweetedBy) {
      try {
        retweetedByArray = JSON.parse(data.retweetedBy);
      } catch (parseError) {
        console.log("Error parsing retweetedBy data: ", parseError);
        retweetedByArray = [];
      }
    }

    if (!retweetedByArray.includes(currentUser)) {
      retweetedByArray.push(currentUser);
    } else {
      const index = retweetedByArray.indexOf(currentUser);
      retweetedByArray.splice(index, 1);
    }

    data.retweets = retweetedByArray.length;
    data.retweetedBy = JSON.stringify(retweetedByArray);
    await set(tweetRef, data);
  }
};

const handleReplyClick = (replyId) =>
  document.getElementById(`replies-${replyId}`).classList.toggle("hidden");

const handleTweetBtnClick = () => {
  const tweetInput = document.getElementById("tweet-textarea");
  const messageError = document.querySelector("#message-error");

  if (tweetInput.value) {
    push(tweetsRef, {
      handle: `@${auth.currentUser.displayName}`,
      profilePic: `../images/scrimbalogo.png`,
      likes: 0,
      retweets: 0,
      tweetText: tweetInput.value,
      replies: JSON.stringify([]),
      likedBy: JSON.stringify([]),
      retweetedBy: JSON.stringify([]),
      createdBy: `${auth.currentUser.uid}`,
    });
    tweetInput.value = "";
    tweetInput.classList.remove("highlight");
    messageError.classList.add("hidden");
  } else {
    highlightInputField(tweetInput);
    messageError.classList.remove("hidden");
  }
};

const highlightInputField = (field) => {
  field.classList.add("highlight");
};
