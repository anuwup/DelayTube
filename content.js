const getPageType = () => {
  const url = location.href;
  if (url.includes("playlist?list=WL")) return "dt-watchlater";
  if (url.includes("feed/subscriptions")) return "dt-subscriptions";
  if (url.includes("results?search_query=")) return "dt-search";
  if (url.includes("playlist?list=")) return "dt-playlists";
  if (url.includes("/@") || url.includes("channel")) return "dt-channel";
  if (url === "https://www.youtube.com/" || url === "https://www.youtube.com")
    return "dt-home";
  return "unknown";
};

let delayToggles = {};
chrome.storage.sync.get(null, (res) => {
  delayToggles = res;
});

let relaxRules = {};
chrome.storage.sync.get("relaxationRules", (res) => {
  relaxRules = res.relaxationRules || [];
});

function isInRelaxationPeriod(relaxRules) {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toTimeString().slice(0, 5); // HH:MM

  return relaxRules.some((rule) => {
    if (rule.days.includes("Daily") || rule.days.includes(day)) {
      return rule.start <= time && time <= rule.end;
    }
    return false;
  });
}

document.addEventListener(
  "click",
  function (e) {
    const anchor = e.target.closest(
      "a#thumbnail, a.yt-simple-endpoint, a[href*='watch'], ytd-video-preview",
    );
    if (!anchor) {
      // console.log("no anchor found");
      return;
    } else if (!anchor.href?.includes("watch")) {
      console.log("Ignoring non-video click");
      return;
    }
    // log what was clicked
    console.log("Target: ", e.target.tagName, e.target.className);
    console.log("Anchor: ", anchor?.tagName, anchor?.href);
    const pageType = getPageType();
    console.log("Page Type: ", pageType);
    if (pageType === "dt-watchlater" || pageType === "unknown") return;

    if (!delayToggles[pageType]) {
      console.log(`Delay disabled on ${pageType}`);
      return;
    }

    if (isInRelaxationPeriod(relaxRules)) {
      console.log("Relaxation period active, letting video play");
      return;
    }
    e.preventDefault();
    // TODO: what are we doing here?
    e.stopImmediatePropagation(); // prevent YouTube from hijacking the click

    const videoLink = anchor.href;
    console.log("Intercepted Link: ", videoLink);

    // extract video id
    const videoId = new URL(videoLink).searchParams.get("v");

    if (!videoId) {
      console.error("Could not extract video ID");
      return;
    }

    // Find tile by matching video ID in href
    const allTiles = document.querySelectorAll(
      "ytd-video-renderer, ytd-rich-item-renderer, ytd-rich-grid-media",
    );

    let tile = null;
    for (const t of allTiles) {
      const a = t.querySelector(`a[href*="watch?v=${videoId}"]`);
      if (a) {
        tile = t;
        break;
      }
    }

    if (!tile) {
      console.warn("Tile not found for video ID ", videoId);
      return;
    } else {
      console.log("Found tile: ", tile);
    }

    const menuButton = tile.querySelector(
      "ytd-menu-renderer yt-icon-button#button button",
    );
    if (!menuButton) {
      console.warn("Menu button not found");
      return;
    }
    menuButton.click();

    setTimeout(() => {
      const items = Array.from(
        document.querySelectorAll("ytd-menu-service-item-renderer"),
      );
      const watchLaterItem = items.find((item) =>
        item.innerText.toLowerCase().includes("watch later"),
      );

      if (watchLaterItem) {
        watchLaterItem.click();
        console.log("Added to Watch later");
        // close the menu
        setTimeout(() => {
          document.body.click();
        }, 100);
      } else {
        console.warn("Watch Later item not found");
      }
    }, 200);
  },
  true,
);
