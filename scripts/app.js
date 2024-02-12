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

const redirectToLogin = () => (window.location.href = "../index.html");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    redirectToLogin();
  }
});

const handleLogout = () => signOut(auth);

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
  const currentUser = auth.currentUser.uid;

  tweets.forEach((tweet) => {
    const tweetVal = tweet[1];
    const replies = JSON.parse(tweetVal.replies);
    let repliesHTML = getRepliesHTML(tweetVal, replies);
    const isLiked = JSON.parse(tweetVal.likedBy.includes(currentUser));
    const isRetweeted = JSON.parse(tweetVal.retweetedBy.includes(currentUser));

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
  if (e.target.dataset.like) {
    handleLikeClick(e.target.dataset.like);
  } else if (e.target.dataset.retweet) {
    handleRetweetClick(e.target.dataset.retweet);
  } else if (e.target.dataset.reply) {
    handleReplyClick(e.target.dataset.reply);
  } else if (e.target.id === "tweet-btn") {
    handleTweetBtnClick();
  } else if (e.target.dataset.replyBtn) {
    handleReplyBtnClick(e.target.dataset.replyBtn);
  } else if (e.target.id === "sign-out-btn") {
    handleLogout();
  }
});

const handleReplyBtnClick = async (tweetId) => {
  const tweetRef = ref(database, `tweets/${tweetId}`);
  const snapshot = await get(tweetRef);
  const replyText = document.querySelector(`#${tweetId} textarea`).value;

  if (replyText) {
    const replyObj = {
      handle: `@${auth.currentUser.displayName}`,
      profilePic: `../images/scrimbalogo.png`,
      tweetText: replyText,
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
  }
};
