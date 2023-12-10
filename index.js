import { v4 as uuidv4 } from "https://jspm.dev/uuid";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  get,
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
  const tweets = Object.values(jsonData);
  let feedHTML = ``;

  tweets.forEach((tweet) => {
    const replies = JSON.parse(tweet.replies);
    let likeIconClass = handleLikeStyles(tweet);
    let retweetIconClass = handleRetweetStyles(tweet);
    let repliesHTML = getRepliesHTML(tweet, replies);

    feedHTML += `
    <div class="tweet">
        <div class="tweet-inner">
            <img src="${tweet.profilePic}" class="profile-pic">
            <div>
                <p class="handle">${tweet.handle}</p>
                <p class="tweet-text">${tweet.tweetText}</p>
                <div class="tweet-details">
                    <span class="tweet-detail">
                        <i class="tweet-icon fa-regular fa-comment-dots"
                        data-reply="${tweet.uuid}"
                        ></i>
                        ${replies.length}
                    </span>
                    <span class="tweet-detail">
                        <i class="tweet-icon fa-solid fa-heart ${likeIconClass}"
                        data-like="${tweet.uuid}"
                        ></i>
                        ${tweet.likes}
                    </span>
                    <span class="tweet-detail">
                        <i class="tweet-icon fa-solid fa-retweet ${retweetIconClass}"
                        data-retweet="${tweet.uuid}"
                        ></i>
                        ${tweet.retweets}
                    </span>
                </div>
            </div>
        </div>
        <div class="hidden" id="replies-${tweet.uuid}">
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

const handleLikeStyles = (tweet) => (tweet.isLiked ? "liked" : "");

const handleRetweetStyles = (tweet) => (tweet.isRetweeted ? "retweeted" : "");

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

const handleLikeClick = (tweetId) => {
  const targetTweetObj = tweetsData.filter(
    (tweet) => tweet.uuid === tweetId
  )[0];

  if (targetTweetObj.isLiked) {
    targetTweetObj.likes--;
  } else {
    targetTweetObj.likes++;
  }
  targetTweetObj.isLiked = !targetTweetObj.isLiked;
  render();
};

const handleRetweetClick = (tweetId) => {
  const targetTweetObj = tweetsData.filter(
    (tweet) => tweet.uuid === tweetId
  )[0];

  if (targetTweetObj.isRetweeted) {
    targetTweetObj.retweets--;
  } else {
    targetTweetObj.retweets++;
  }
  targetTweetObj.isRetweeted = !targetTweetObj.isRetweeted;
  render();
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
      isLiked: false,
      isRetweeted: false,
      uuid: uuidv4(),
    });
    tweetInput.value = "";
  }
};
