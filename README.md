# Claude Bailout Monitor

A VS Code extension that monitors terminal output for AI coding assistant bailout patterns.

## Features

- Real-time detection of AI bailout patterns in terminal output
- Catches sub-agent reasoning and suppressed content
- Research-backed pattern detection (AI tools are only 46-65% accurate)
- Works with any AI tool (Claude, ChatGPT, Aider, etc.)

## Research Background

Based on studies showing:
- AI coding tools produce correct code only 46-65% of the time
- 50% of AI-generated code contains security flaws
- 2/3 of developers cite "almost right, but not quite" as primary frustration
- MIT study: AI tools make experienced developers 19% slower due to debugging

## Installation

1. Clone this repository
2. Run `npm install`
3. Open in VS Code and press F5 to run in development mode

## Usage

The extension automatically monitors terminal output when VS Code starts.

Commands:
- `Claude Bailout Monitor: Enable` - Enable monitoring
- `Claude Bailout Monitor: Disable` - Disable monitoring  
- `Claude Bailout Monitor: Show Statistics` - View detection stats

## Development

```bash
npm install
npm run compile
# Press F5 in VS Code to run extension
the gitignore file doesnt show in finder. is it hidden by default?
cd ..
