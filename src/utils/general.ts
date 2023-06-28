import { EMAIL_REGEX, URL_REGEX } from "@constants/data";
import { ex } from "@fullcalendar/core/internal-common";
import { MantineColor, MantineTheme } from "@mantine/core";
import { startCase } from "lodash";
import moment from "moment";
import { Channel } from "src";

export function testDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Given a string, returns the first and last name.
 * @param name
 * @returns
 */
export function splitName(name: string | null) {
  if (!name) {
    return {
      first: "",
      last: "",
    };
  }
  let parts = name.split(" ");
  return {
    first: parts[0],
    last: parts[parts.length - 1],
  };
}

/**
 * Given a date, returns a string in the format YYYY-MM-DD.
 * @param date
 * @returns
 */
export function formatDate(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Given a string, returns a number between 0 and range that is consistent for the same string.
 * @param str
 * @param range
 * @returns - Consistent number between 0 and range
 */
export function hashString(str: string, range: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % range;
  }
  return hash;
}

/**
 * Given a number between 0 and 100, returns a color between red and green.
 * @param input
 * @returns - Color between red and green
 */
export function percentageToColor(input: number): string {
  if (input < 0 || input > 100) {
    throw new Error("Input must be between 0 and 100");
  }

  const startColor = { r: 224, g: 49, b: 49 };
  const midColor = { r: 255, g: 212, b: 59 };
  const endColor = { r: 9, g: 146, b: 104 };

  let r, g, b;
  if (input <= 50) {
    r = startColor.r + ((midColor.r - startColor.r) * input) / 50;
    g = startColor.g + ((midColor.g - startColor.g) * input) / 50;
    b = startColor.b + ((midColor.b - startColor.b) * input) / 50;
  } else {
    r = midColor.r + ((endColor.r - midColor.r) * (input - 50)) / 50;
    g = midColor.g + ((endColor.g - midColor.g) * (input - 50)) / 50;
    b = midColor.b + ((endColor.b - midColor.b) * (input - 50)) / 50;
  }

  return (
    "#" +
    ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b))
      .toString(16)
      .slice(1)
  );
}


/**
 * Converts a date to a string in the format YYYY-MM-DD, h:mm a
 * @param date 
 * @returns - Date in the format YYYY-MM-DD, h:mm a
 */
export function convertDateToShortFormat(date: Date) {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = date.getHours() % 12 || 12;
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const ampm = date.getHours() >= 12 ? 'pm' : 'am';
  return `${year}-${month}-${day}, ${hours}:${minutes} ${ampm}`;
}


/**
 * Converts a date to a local time string in the format MMM D, h:mm a
 * @param date 
 * @returns - Date in the format MMM D, h:mm a
 */
export function convertDateToLocalTime(date: Date) {
  if(date.getTime() === 0) { return "Unknown Time"; }
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
}


/**
 * Converts a date to a relative timeframe string (e.g. 2 hours ago)
 */
export function convertDateToCasualTime(date: Date) {
  if (date.getTime() === 0) { return ""; }
  const currentTime = moment();
  const inputTime = moment(date);
  return inputTime.from(currentTime);
}


/**
 * Returns a fitting color for a given value.
 * @param theme
 * @param value
 * @returns - color name in mantine theme colors
 */
const PRESET_COLOR_MAPS: Record<string, MantineColor> = {
  complete: "blue",
  cancelled: "red",
  linkedin: "indigo",
  email: "orange",
  accepted: "green",
  active_convo: "yellow",
  active_convo_objection: "yellow",
  active_convo_qual_needed: "yellow",
  active_convo_question: "yellow",
  active_convo_scheduling: "yellow",
  active_convo_next_steps: "yellow",
  bumped: "orange",
  demo: "blue",
  demo_complete: "green",
  demo_lost: "red",
  demo_loss: "red",
  demo_set: "pink",
  scheduling: "pink",
  email_clicked: "blue",
  email_replied: 'orange',
  email_opened: 'yellow',
  unknown: 'blue',
  disqualified: 'red',
  errror: 'red',
  upload_failed: 'orange',
  years_of_experience_at_current_job: 'red',
  current_job_specialties: 'pink',
  no_show: 'red',

  terrible: 'red',
  poor: 'orange',
  fair: 'yellow',
  good: 'lime',
  great: 'green',
  excellent: 'teal',
};
export function valueToColor(theme: MantineTheme, value: string): MantineColor {
  if(!value) { return "gray"; }
  value = value.toLowerCase().trim().replaceAll(" ", "_");

  if (PRESET_COLOR_MAPS[value]) {
    return PRESET_COLOR_MAPS[value];
  }

  // Get a 'random' mantine color name
  let i = 0;
  let index = hashString(value, Object.keys(theme.colors).length);
  for (let color in theme.colors) {
    if (i === index) {
      return color satisfies MantineColor;
    }
    i++;
  }

  return "gray";
}

export function formatToLabel(value: string) {
  if(!value) { return ''; }
  value = value.toLowerCase().replaceAll(" ", "_");
  if (value === "responded") {
    return "Bumped";
  }
  if (value === "demo_set") {
    return "Demo Scheduled";
  }
  if (value === "demo_won") {
    return "Demo Complete";
  }
  if (value === "demo_loss" || value === "demo_lost") {
    return "Demo Missed";
  }
  if (value === "linkedin") {
    return "LinkedIn";
  }
  return startCase(value.replaceAll("_", " ")).replace("Url", "URL");
}

/**
 * Returns the initials for a given name
 * @param name 
 * @returns - Initials for a given name
 */
export function nameToInitials(name: string | undefined){
  if(!name) { return ''; }
  const names = name.split(" ");
  if(names.length === 1){
    return names[0][0];
  } else {
    return names[0][0] + names[names.length - 1][0];
  }
}

/**
 * Returns the URL for our browser extension
 * @param isFirefox - Whether the browser is firefox
 * @returns - URL for our browser extension
 */
export function getBrowserExtensionURL(isFirefox: boolean){
  if(isFirefox){
    return "https://addons.mozilla.org/en-US/firefox/addon/sellscale-browser-extension/";
  } else {
    return "https://chrome.google.com/webstore/detail/sellscale-browser-extensi/hicchmdfaadkadnmmkdjmcilgaplfeoa/";
  }
}


export function isEmail(text: string){
  return !!text.match(EMAIL_REGEX);
}

export function isURL(text: string){
  return !!text.match(URL_REGEX);
}

export function isLinkedInURL(text: string){
  return isURL(text) && text.includes("linkedin.com/in/");
}

export function hexToHexWithAlpha(hexColor: string, transparency: number): string | null {
  // Remove the "#" character from the hex color code
  hexColor = hexColor.replace("#", "");

  // Ensure that the hex color code is valid
  const isValidHex = /^([0-9A-F]{3}){1,2}$/i.test(hexColor);
  if (!isValidHex) {
    return null;
  }

  // Extract the RGB values
  const red = parseInt(hexColor.substring(0, 2), 16);
  const green = parseInt(hexColor.substring(2, 4), 16);
  const blue = parseInt(hexColor.substring(4, 6), 16);

  // Calculate the alpha value
  const alpha = Math.round(transparency * 255).toString(16).padStart(2, '0');

  // Create the hex color code with transparency
  const hexColorWithAlpha = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}${alpha}`;

  return hexColorWithAlpha;
}


/**
 * Removes extra characters (like emojis) from a string
 * @param str
 * @returns - String with extra characters removed
 */
export function removeExtraCharacters(str: string) {
  return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
}


/**
 * Checks if a date is within the last X days
 * @param date
 * @param days
 * @returns - Whether the date is within the last X days
*/
export function isWithinLastXDays(date: Date, days: number) {
  return (Date.now() - date.getTime()) > (days * 24 * 60 * 60 * 1000);
}
