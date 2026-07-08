/**
 * Builds the "Copy prompt" payload: a self-contained brief an AI coding
 * agent (Claude Code, Cursor, etc.) can use to rebuild the captured screen.
 * Deliberately instructs the agent to use its own placeholder content and
 * skip trademarked brand assets.
 */
export function buildScreenPrompt(app, screen) {
  const isWeb = screen.platform === "web";
  return [
    `Recreate this ${isWeb ? "web page" : "mobile app screen"} design as a working UI.`,
    "",
    `Reference screenshot: ${screen.image_url}`,
    app?.name && `Product: ${app.name}${app.tagline ? ` — ${app.tagline}` : ""}`,
    app?.website_url && `Product site: ${app.website_url}`,
    screen.title && `Page title: ${screen.title}`,
    screen.page_url && `Live page: ${screen.page_url}`,
    screen.description && `About this page: ${screen.description}`,
    "",
    "Task:",
    `1. Study the reference screenshot and rebuild the screen as a responsive React + Tailwind CSS component${isWeb ? " (desktop-first, 1440px design width)" : " (mobile, 390px design width)"}.`,
    "2. Match the layout structure, section order, spacing rhythm, typography hierarchy, and color palette you see in the screenshot.",
    "3. Use your own placeholder copy, images, and logo — do not reproduce trademarked brand assets or proprietary artwork.",
    "4. Return one self-contained component with no external UI libraries beyond Tailwind.",
  ]
    .filter((line) => line !== null && line !== undefined && line !== false)
    .join("\n");
}
