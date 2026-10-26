/**
 * Classify yt-dlp errors so the UI can explain why a video failed.
 *
 * Categories:
 *   members      members-only video (needs cookies of an account that joined the channel)
 *   age          age-restricted (needs cookies of an age-verified account)
 *   bot          YouTube asks to confirm you are not a bot (needs cookies or try later)
 *   private      private video
 *   geo          not available in your country
 *   format       requested format not available (often DRM-protected content)
 *   unavailable  removed / not available (may also be members-only, YouTube does not say)
 *   other
 */

// Categories that a signed-in account (cookies) can fix. "unavailable" is included because
// members-only videos report the same message when no cookies are given
const COOKIE_CATEGORIES = ['members', 'age', 'bot', 'private', 'unavailable'];

// Members-only videos without cookies only report "This video is not available",
// so also look at the title, where creators usually mark them (會限 / メン限 / members only)
const MEMBERS_TITLE = /(會限|会限|會員限定|会员限定|メン限|メンバー限定|members?[\s-]*only|membership)/i;

const classifyError = (message, title = '') => {
  if (/members[\s-]*only|join this channel|channel'?s members|subscriber_only/i.test(message)) return 'members';
  if (/confirm your age|age[\s-]*restricted|inappropriate for some users/i.test(message)) return 'age';
  if (/not a bot/i.test(message)) return 'bot';
  if (/private video/i.test(message)) return 'private';
  if (/available in your country|geo[\s-]*restrict/i.test(message)) return 'geo';
  if (/requested format is not available/i.test(message)) return 'format';
  if (/not available|unavailable|has been removed|terminated/i.test(message)) {
    return MEMBERS_TITLE.test(title) ? 'members' : 'unavailable';
  }
  return 'other';
};

// "ERROR: [youtube] <id>: <message>" -> { id, message }; id is null when the line has none
const parseErrorLine = (line) => {
  const m = line.match(/^ERROR: \[[^\]]+\] ([\w-]+): (.*)$/);
  if (m) return { id: m[1], message: m[2] };
  return { id: null, message: line.replace(/^ERROR:\s*/, '') };
};

/**
 * Collects per-video failures during a download and builds the final summary.
 * titles: Map of video id -> title (from the info probe)
 */
const createFailureTracker = (titles = new Map()) => {
  const failures = new Map();
  let anonymous = 0;

  return {
    // Record an "ERROR:" line; returns the category
    add(line) {
      const { id, message } = parseErrorLine(line);
      const category = classifyError(message, (id && titles.get(id)) || '');
      failures.set(id || `#${anonymous++}`, { id, category });
      return category;
    },
    summary({ total, skipped, downloaded, usedCookies }) {
      const categories = {};
      for (const { category } of failures.values()) {
        categories[category] = (categories[category] || 0) + 1;
      }
      const needsCookies = COOKIE_CATEGORIES.some((c) => categories[c]);
      return {
        total,
        downloaded,
        skipped,
        failed: failures.size,
        categories,
        usedCookies,
        // Highlight the cookie option only when cookies were not given yet
        suggestCookies: needsCookies && !usedCookies,
      };
    },
  };
};

module.exports = { COOKIE_CATEGORIES, classifyError, parseErrorLine, createFailureTracker };
