/**
 * Escapes all special regex characters from a user-supplied string.
 * Prevents ReDoS (Regular Expression Denial of Service) attacks
 * when the string is used inside a MongoDB $regex query.
 *
 * @param {string} str - Raw user input
 * @returns {string} - Safely escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = escapeRegex;
