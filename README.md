# Text Linter

Text Linter is a Raycast extension for cleaning pasted Markdown and prose before copying, pasting, or saving the result.

It is optimized for fast clipboard workflows:

- Paste or prefill text from the clipboard.
- Copy the cleaned text.
- Paste rich HTML or plain text into the frontmost app.
- Save the result through the native macOS save dialog.
- Configure rules from a dedicated Raycast command.

The bundled defaults are inspired by a personal Markdown linting setup, with a focus on predictable spacing, headings, lists, footnotes, quotes, and paste cleanup.

## Commands

- `Lint Text`: Clean text and act on the result.
- `Configure Rules`: Toggle rules, adjust options, and restore defaults.

## Development

```bash
npm install
npm run test
npm run build
```

## Store Notes

The extension uses Raycast's built-in Action Panel patterns for copy/paste behavior and stores rule customization locally with Raycast storage.
