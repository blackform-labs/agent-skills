# Lists

[Material component specifications](https://m3.material.io/components/lists/specs) · [Versioned dimension source](https://m3.material.io/_dsm/data/dsdb-m3/2026-11-18_15-40-01/TOKEN_TABLE.6c818a16475113bd.json)

Classify the item by line count, variant and state. Measure the row separately from its leading and trailing slots. Custom slots need a target at least 48 × 48 dp. For expressive selection, inner and outer corners can differ.

## List (baseline) · Layout · Three-line lists

| Attribute | Value |
| --- | --- |
| Label left padding | 16dp |
| Leading element left padding | 16dp |
| Leading icon top padding | 8dp |
| Leading icon top padding when height is 88dp or taller | 12dp |
| Trailing element left padding | 16dp |
| Trailing element right padding | 24dp |
| Padding above/below divider | 0dp |
| Targets | 48dp |
| Divider full-width | 100% |
| Divider inset left padding | 16dp |
| Divider inset right padding | 24dp |

## List - Common

Token prefix: `md.comp.list`.

| Token suffix | Specified value |
| --- | --- |
| container.shape | 16 dp |
| divider.bottom-space | 0 dp |
| divider.leading-space | 16 dp |
| divider.top-space | 0 dp |
| divider.trailing-space | 16 dp |
| focus.indicator.outline.offset | -3 dp |
| focus.indicator.thickness | 3 dp |
| list-item.between-space | 12 dp |
| list-item.bottom-space | 10 dp |
| list-item.container.expressive.shape | 4 dp |
| list-item.container.shape | 0 dp |
| list-item.disabled.container.expressive.shape | 4 dp |
| list-item.dragged.container.expressive.shape | 16 dp |
| list-item.focused.container.expressive.shape | 16 dp |
| list-item.hovered.container.expressive.shape | 12 dp |
| list-item.label-text.line-height | 24 pt (source) |
| list-item.label-text.size | 16 pt (source) |
| list-item.label-text.tracking | 0 pt (source) (Variable) · 0.5 pt (source) (Static or iOS bold) |
| list-item.label-text.type | 16 pt (source) / 24 pt (source) / 0 pt (source) (Variable) · 16 pt (source) / 24 pt (source) / 0.5 pt (source) (Static or iOS bold) |
| list-item.large.leading-video.height | 64 dp |
| list-item.large.leading-video.width | 114 dp |
| list-item.leading-avatar-label.line-height | 24 pt (source) |
| list-item.leading-avatar-label.size | 16 pt (source) |
| list-item.leading-avatar-label.tracking | 0 pt (source) (Variable) · 0.15 pt (source) (Static or iOS bold) |
| list-item.leading-avatar-label.type | 16 pt (source) / 24 pt (source) / 0 pt (source) (Variable) · 16 pt (source) / 24 pt (source) / 0.15 pt (source) (Static or iOS bold) |
| list-item.leading-avatar.shape | Full |
| list-item.leading-avatar.size | 40 dp |
| list-item.leading-icon.expressive.size | 20 dp |
| list-item.leading-icon.size | 24 dp |
| list-item.leading-image.expressive.shape | 8 dp |
| list-item.leading-image.height | 56 dp |
| list-item.leading-image.shape | 0 dp |
| list-item.leading-image.width | 56 dp |
| list-item.leading-space | 16 dp |
| list-item.leading-video.shape | 8 dp |
| list-item.leading-video.width | 100 dp |
| list-item.one-line.container.height | 56 dp |
| list-item.overline.line-height | 16 pt (source) |
| list-item.overline.size | 11 pt (source) |
| list-item.overline.tracking | 0 pt (source) (Variable) · 0.5 pt (source) (Static or iOS bold) |
| list-item.overline.type | 11 pt (source) / 16 pt (source) / 0 pt (source) (Variable) · 11 pt (source) / 16 pt (source) / 0.5 pt (source) (Static or iOS bold) |
| list-item.pressed.container.expressive.shape | 16 dp |
| list-item.selected.container.expressive.shape | 16 dp |
| list-item.selected.container.shape | 16 dp |
| list-item.selected.disabled.container.expressive.shape | 16 dp |
| list-item.selected.dragged.container.expressive.shape | 16 dp |
| list-item.selected.focused.container.expressive.shape | 16 dp |
| list-item.selected.hovered.container.expressive.shape | 16 dp |
| list-item.selected.pressed.container.expressive.shape | 16 dp |
| list-item.small.leading-video.height | 56 dp |
| list-item.small.leading-video.width | 100 dp |
| list-item.supporting-text.line-height | 20 pt (source) |
| list-item.supporting-text.size | 14 pt (source) |
| list-item.supporting-text.tracking | 0 pt (source) (Variable) · 0.25 pt (source) (Static or iOS bold) |
| list-item.supporting-text.type | 14 pt (source) / 20 pt (source) / 0 pt (source) (Variable) · 14 pt (source) / 20 pt (source) / 0.25 pt (source) (Static or iOS bold) |
| list-item.three-line.container.height | 88 dp |
| list-item.top-space | 10 dp |
| list-item.trailing-icon.expressive.size | 20 dp |
| list-item.trailing-icon.size | 24 dp |
| list-item.trailing-space | 16 dp |
| list-item.trailing-supporting-text.line-height | 16 pt (source) |
| list-item.trailing-supporting-text.size | 11 pt (source) |
| list-item.trailing-supporting-text.tracking | 0 pt (source) (Variable) · 0.5 pt (source) (Static or iOS bold) |
| list-item.trailing-supporting-text.type | 11 pt (source) / 16 pt (source) / 0 pt (source) (Variable) · 11 pt (source) / 16 pt (source) / 0.5 pt (source) (Static or iOS bold) |
| list-item.two-line.container.height | 72 dp |
| segmented.gap | 2 dp |

## List - Expand

Token prefix: `md.comp.list.expand`.

| Token suffix | Specified value |
| --- | --- |
| container.shape | 16 dp |
| trailing-icon.shape | Full |

## List - Reorder

Token prefix: `md.comp.list.reorder`.

| Token suffix | Specified value |
| --- | --- |
| list-item.shape | 16 dp |

## List - Reveal

Token prefix: `md.comp.list.reveal`.

| Token suffix | Specified value |
| --- | --- |
| list-item.container.shape | 16 dp |
| list-item.icon-button.action.container.shape | 16 dp |
| list-item.icon-button.container.shape | Full |
| list-item.segmented.container.shape | 16 dp |
