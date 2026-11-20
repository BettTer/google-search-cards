# Google Search: More Results at a Glance · Google 搜索：一屏多看

[简体中文](#简体中文) · [English](#english)

## 简体中文

**把 Google 搜索结果排成带编号的两列卡片，一屏多看几条，少滚几下。**

宽屏搜索时，单列结果往往只用到屏幕左边。这个脚本把右边的空间也用起来，让你在同一屏比较更多网站的标题和摘要。

- **一屏多看几条。** 网页、新闻、视频和 Google Lens 的「完全匹配」结果都可以排成两列。卡片逐行排列，同一行等高。打开 Google 侧栏时，卡片跟着可用空间调整，窗口太窄时自动回到单列。
- **一眼知道看到第几条。** 每条结果的右上角都有编号。在同一标签页依次翻页或加载更多结果时，编号按实际卡片数量接着数。图片集合和问答模块不占号。
- **缩略图在同一搜索标签内对齐。** 单张图按卡片顶边定位，多张图作为一组保留在原有图片区。
- **适配浅色和夜间主题。** Lens「全部」里的网页结果排成两列，图片集合独占一行。Google 图片搜索和 Lens「视觉匹配」沿用原生布局。

### 安装和更新

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. 打开 [google-search-cards.user.js](./google-search-cards.user.js)，点击 **Raw**，在 Tampermonkey 中确认安装或更新。
3. 刷新 Google 搜索结果页。如果启用了其他会修改 Google 搜索布局的脚本或 Stylus 样式，请先停用它们。

如果旧版是手动粘贴安装的，可以在 **Tampermonkey → 管理面板** 中打开现有脚本，用新版完整替换代码并保存。

支持 `google.com`、`google.ca`、`google.co.uk` 和 `google.com.hk` 的 `www` 搜索页面。脚本在浏览器内调整布局，翻页计数保存在当前标签页，脚本不会发送搜索查询。

感谢 [iwyvi 的多栏搜索样式](https://userstyles.world/style/3155) 带来的灵感。这个脚本是独立实现，采用 [MIT 许可证](./LICENSE)。

[GitHub 源码](https://github.com/BettTer/google-search-cards) · [反馈问题](https://github.com/BettTer/google-search-cards/issues)

## English

**See more Google results at once with numbered, two-column cards. Compare results with less scrolling.**

Google's single-column layout leaves a lot of space unused on a wide screen. This script puts that space to work so you can compare more titles and snippets on one screen.

- **See more results on one screen.** Web, News, Videos, and Google Lens Exact matches use two columns when there's room. Cards are the same height within each row. They resize when the Google sidebar opens or closes, and narrow windows switch to one column.
- **Keep your place.** Each result has a number in the top right. When you page through results in the same browser tab, numbering picks up where you left off and continues as more results load. Image collections and question modules don't count toward the sequence.
- **Keep thumbnails aligned within each search tab.** Single thumbnails align relative to the top of the card. Multi-image results keep their original gallery layout.
- **Use either Google theme.** Cards adapt to light and dark mode. In Lens All, web results use two columns and image collections span the full row. Google Images and Lens Visual matches retain Google's layout.

### Install and update

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open [google-search-cards.user.js](./google-search-cards.user.js), choose **Raw**, and confirm installation or update in Tampermonkey.
3. Refresh your Google search results. Disable any other userscript or Stylus style that changes the same layout.

If you installed an earlier version by pasting the source, open the existing script in the **Tampermonkey Dashboard**, replace its contents with the new version, and save.

Supports the `www` search pages on `google.com`, `google.ca`, `google.co.uk`, and `google.com.hk`. The script runs in your browser. It keeps pagination counts in the current tab and does not transmit search queries.

Thanks to [iwyvi's multi-column search style](https://userstyles.world/style/3155) for the inspiration. This independent implementation is released under the [MIT License](./LICENSE).

[Source code on GitHub](https://github.com/BettTer/google-search-cards) · [Report an issue](https://github.com/BettTer/google-search-cards/issues)
