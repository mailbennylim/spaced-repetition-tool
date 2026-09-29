/**
 * CSS the build-time parser (lightningcss in Turbopack) doesn't understand yet but browsers do:
 * the CSS Custom Highlight API pseudo-elements used for the spoken word and Find matches.
 */
const css = `
::highlight(tts-word) { background-color: rgba(70, 147, 254, .28); }
::highlight(find-match) { background-color: rgba(0, 114, 255, .30); }
::highlight(find-current) { background-color: rgba(255, 196, 0, .55); color: #000; }
`;

export default function RuntimeStyles() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
