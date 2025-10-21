// A simple utility to generate SVG data URLs for avatars.

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

/**
 * Generates initials from a full name.
 * @param name - The full name of the user.
 * @returns A string of 1 or 2 initials.
 */
const getInitials = (name: string): string => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length > 1) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    if (words[0] && words[0].length > 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return '?';
};

/**
 * Generates a deterministic color from a string (e.g., a name).
 * @param name - The string to use for color generation.
 * @returns A hex color code from the predefined COLORS array.
 */
const generateColor = (name: string): string => {
    if (!name) return COLORS[0];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLORS[charCodeSum % COLORS.length];
};

/**
 * Creates an SVG avatar as a Base64 data URL.
 * @param name - The name to display as initials in the avatar.
 * @returns A data URL string representing the SVG image.
 */
export const generateAvatar = (name: string): string => {
    const initials = getInitials(name);
    const color = generateColor(name);

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="100%" height="100%" fill="${color}" />
        <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="60" font-family="sans-serif" font-weight="600">
            ${initials}
        </text>
    </svg>
    `;

    // btoa is a browser-only function.
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};
