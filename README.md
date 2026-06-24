# Text Linter

Text Linter is a public Raycast extension project for cleaning pasted Markdown and prose before copying, pasting, or saving the result. It is currently positioned as a polished GitHub utility, not a submitted Raycast Store extension.

## What It Does

- Paste or prefill text from the clipboard.
- Paste rich HTML with `⌘↵`.
- Paste as HTML or plain text with `⌥⌘↵`.
- Paste plain text directly with `⌃⌘↵`.
- Copy the cleaned text from the Action Panel.
- Save the result through the native macOS save dialog.
- Configure rules from a dedicated Raycast command.

The bundled defaults are inspired by a personal Markdown linting setup, with a focus on predictable spacing, headings, lists, footnotes, quotes, and paste cleanup.

## Example

Input:

```markdown


## a heading:

-item

```

Output:

```markdown
## a Heading

- item
```

## Commands

- `Lint Text`: Clean text and act on the result.
- `Configure Rules`: Toggle rules, adjust options, and restore defaults.

## Install From Source

```bash
npm install
npm run build
```

Then open the extension in Raycast from this local checkout.

## Privacy and Behavior

Text Linter runs locally. It does not make network requests, include external analytics, request Keychain access, or bundle opaque binaries. Rule customizations are stored with Raycast local storage.

## Store Readiness

This repository is reasonable to share publicly now. Before Raycast Store submission, it still needs:

- Store screenshots or a short demo: capture three 2000x1250 PNG screenshots with Raycast Window Capture, focused only on the extension and free of sensitive data.
- A product decision on `Configure Rules`: Raycast's Store guidance discourages separate commands whose only purpose is configuration. Either move the common options into Raycast Preferences, or be prepared to justify the rule editor as a core rule-management command.
- Confirmation that `author` in `package.json` matches the maintainer's Raycast account username.
- A fresh `npm run lint` and `npm run build` from the final submission checkout.

## Development

```bash
npm install
npm run test
npm run build
```
