# @n8n/i18n-backend

Backend i18n package for n8n. Provides internationalization support for the backend/server-side code.

## Features

- Node.js compatible i18n using i18next
- Shared locale files with frontend i18n package
- Support for node translations
- Support for credential translations
- Support for header translations

## Usage

### Basic Usage

```typescript
import { i18n, setLanguage } from '@n8n/i18n-backend';

// Set the locale
setLanguage('fa');

// Use base text
const text = i18n.baseText('generic.save');

// Use node text
const nodeText = i18n.nodeText('n8n-nodes-base.coda');
const displayName = nodeText.inputLabelDisplayName(parameter, path);
```

### Loading Node Translations

```typescript
import { loadAndRegisterNodeTranslation } from '@n8n/i18n-backend';

// Load and register a node translation
await loadAndRegisterNodeTranslation(
  nodeSourcePath,
  'n8n-nodes-base.coda',
  'fa'
);
```

### Initialization

The i18n system is automatically initialized when the server starts via `BaseCommand.init()`. The locale is set based on `GlobalConfig.defaultLocale`.

## API

### `i18n`

Main i18n instance with methods:
- `baseText(key, options?)` - Get base text translation
- `nodeText(nodeType)` - Get node-specific text methods
- `credText(credentialType)` - Get credential-specific text methods
- `headerText({ key, fallback })` - Get header text
- `setLanguage(locale)` - Set the current locale

### `setLanguage(locale: string)`

Set the current locale for i18n.

### `loadAndRegisterNodeTranslation(nodeSourcePath, longNodeType, locale)`

Load a node translation file and register it with i18n.

### `addNodeTranslation(nodeTranslation, language)`

Add node translations to i18n.

### `addHeaders(headers, language)`

Add node header translations to i18n.

## Locale Files

Locale files are located in `packages/@n8n/i18n-backend/locales/` and are synced with the frontend i18n package.

## Integration

The package is automatically integrated into:
- `BaseCommand` - Initializes i18n on server startup
- `NodeTypesController` - Loads node translations when requested

