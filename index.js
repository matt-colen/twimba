import { v4 as uuidv4 } from "https://jspm.dev/uuid";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  get,
  set,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase setup
const appSettings = {
  databaseURL: "https://twimba-f025b-default-rtdb.firebaseio.com/",
};
const app = initializeApp(appSettings);
const database = getDatabase(app);
const tweetsRef = ref(database, "tweets");

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
  const tweets = Object.entries(jsonData);
  let feedHTML = ``;

  tweets.forEach((tweet) => {
    const tweetVal = tweet[1];
    const replies = JSON.parse(tweetVal.replies);
    let repliesHTML = getRepliesHTML(tweetVal, replies);
    const isLiked = JSON.parse(
      tweetVal.likedBy.includes(localStorage.getItem("user-id"))
    );
    const isRetweeted = JSON.parse(
      tweetVal.retweetedBy.includes(localStorage.getItem("user-id"))
    );

    feedHTML += `
    <div class="tweet">
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
        <div class="hidden" id="replies-${tweet[0]}">
            ${repliesHTML}
        </div>
    </div>
    `;
  });
  return feedHTML;
};

const getRepliesHTML = (tweet, replies) => {
  let repliesHTML = "";

  if (replies > 0) {
    tweet.replies.forEach((reply) => {
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
  }
});

const handleLikeClick = async (tweetId) => {
  const tweetRef = ref(database, `tweets/${tweetId}`);
  const currentUser = localStorage.getItem("user-id");

  try {
    const snapshot = await get(tweetRef);

    if (snapshot.exists()) {
      const tweetData = snapshot.val();
      const retweetedUsersArray = JSON.parse(tweetData.likedBy);

      if (!retweetedUsersArray.includes(currentUser)) {
        tweetData.likes++;
        retweetedUsersArray.push(currentUser);
        tweetData.likedBy = JSON.stringify(retweetedUsersArray);

        await set(tweetRef, tweetData);
      } else {
        tweetData.likes--;
        const index = retweetedUsersArray.indexOf(currentUser);
        retweetedUsersArray.splice(index, 1);
        if (retweetedUsersArray.length >= 1) {
          console.log(retweetedUsersArray)
          tweetData.likedBy = retweetedUsersArray;
        } else {
          tweetData.likedBy = JSON.stringify([]);
        }

        await set(tweetRef, tweetData);
      }
    }
  } catch (error) {
    console.error("Error updating like: ", error);
  }
};

const handleRetweetClick = async (tweetId) => {
  const tweetRef = ref(database, `tweets/${tweetId}`);
  const currentUser = localStorage.getItem("user-id");

  try {
    const snapshot = await get(tweetRef);

    if (snapshot.exists()) {
      const tweetData = snapshot.val();
      const retweetedUsersArray = JSON.parse(tweetData.retweetedBy);

      if (!retweetedUsersArray.includes(currentUser)) {
        tweetData.retweets++;
        retweetedUsersArray.push(currentUser);
        tweetData.retweetedBy = JSON.stringify(retweetedUsersArray);

        await set(tweetRef, tweetData);
      } else {
        tweetData.retweets--;
        const index = retweetedUsersArray.indexOf(currentUser);
        retweetedUsersArray.splice(index, 1);
        if (retweetedUsersArray.length > 1) {
          tweetData.retweetedBy = retweetedUsersArray;
        } else {
          tweetData.retweetedBy = JSON.stringify([]);
        }

        await set(tweetRef, tweetData);
      }
    }
  } catch (error) {
    console.error("Error updating like: ", error);
  }
};

const handleReplyClick = (replyId) =>
  document.getElementById(`replies-${replyId}`).classList.toggle("hidden");

const handleTweetBtnClick = () => {
  const tweetInput = document.getElementById("tweet-textarea");

  if (tweetInput.value) {
    push(tweetsRef, {
      handle: `@Scrimba`,
      profilePic: `images/scrimbalogo.png`,
      likes: 0,
      retweets: 0,
      tweetText: tweetInput.value,
      replies: JSON.stringify([]),
      likedBy: JSON.stringify([]),
      retweetedBy: JSON.stringify([]),
    });
    tweetInput.value = "";
  }
};

const createUserID = () => {
  localStorage.setItem("user-id", `${uuidv4()}`);
};

if (!localStorage.getItem("user-id")) {
  createUserID();
}
