export const THEME_KEY = "team-recognition:theme";

// Runs before first paint so the saved or system theme never flashes the wrong palette.
export const themeInitScript = `(function(){var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t})()`;
