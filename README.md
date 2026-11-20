# Google Search Cards · Google 搜索卡片

[简体中文](#简体中文) · [English](#english)

## 简体中文

把 Google 网页、新闻、视频搜索结果和 Google Lens 的「完全匹配」排成两列。Google 侧栏展开或收起后，卡片跟着可用空间调整。窄窗口使用单列。

- 搜索卡片逐行排列，同一行的卡片等高。图片集合、问答等模块独占整行，不计入结果编号。
- 编号显示在卡片右上角，跨页时接续。右侧缩略图贴齐卡片内侧边距。
- 支持 Google 夜间模式，卡片边线和编号会随主题调整。
- Lens 的「全部」页面保留两列网页结果，图片集合占整行。
- Google 图片搜索和 Lens 的「视觉匹配」使用原生布局。
- 侧栏在刷新前已展开时，首次收起会同步 Google 的原生 Logo 状态。

### 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. 打开 [google-search-cards.user.js](./google-search-cards.user.js)，点 **Raw**，在 Tampermonkey 中确认安装。
3. 在 Tampermonkey 中启用脚本，刷新 Google 搜索结果页。如果同一页还启用了其他 Google 卡片脚本或 Stylus 样式，先停用它们。

已经装过的用户可以点 **Raw** 并确认 **Update（更新）**。如果旧版是手动粘贴安装的，可以在 **Tampermonkey → 管理面板 → Google Search Cards** 里用新版完整替换现有代码，按 **⌘S**（Mac）或 **Ctrl+S**（Windows／Linux）保存，再刷新 Google 搜索结果页。

支持 `google.com`、`google.ca`、`google.co.uk` 和 `google.com.hk` 的 `www` 搜索页面。脚本只在本地调整页面布局，不采集或发送查询。

这份独立实现以 MIT 许可证发布。感谢 [iwyvi 的多栏搜索样式](https://userstyles.world/style/3155) 提供的灵感。

## English

Display Google web, news, video, and Lens Exact matches results in two columns. Cards resize when the Google sidebar opens or closes. Narrow windows use one column.

- Results are laid out left to right with equal-height cards in each row. Image collections and question modules span both columns and do not count toward the result sequence.
- Numbers appear at the top right and continue onto later results pages. Right-side thumbnails align to the card's inner margin.
- Card borders and result numbers adapt to Google's dark theme.
- In Lens All, image collections span the full row and web results stay in two columns.
- Google Images and Lens Visual matches retain Google's layout.
- After reloading with the sidebar expanded, the first close synchronizes Google's native logo state.

### Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open [google-search-cards.user.js](./google-search-cards.user.js), choose **Raw**, and confirm installation in Tampermonkey.
3. Enable the script and refresh your Google search results. Disable any other Google card script or Stylus style that changes the same page.

To update an existing installation, open **Raw** and confirm **Update**. If you installed by pasting the source, open **Tampermonkey → Dashboard → Google Search Cards**, replace the existing code, and press **⌘S** (Mac) or **Ctrl+S** (Windows/Linux). Then refresh the search results page.

Supports the `www` search pages on `google.com`, `google.ca`, `google.co.uk`, and `google.com.hk`. The script changes layout locally and does not collect or send queries.

This independent implementation is available under the MIT License. Thanks to [iwyvi's multi-column search style](https://userstyles.world/style/3155) for the inspiration.
