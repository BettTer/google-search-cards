# Google Search Cards · Google 搜索卡片

[简体中文](#简体中文) · [English](#english)

## 简体中文

把 Google 网页、新闻、视频搜索结果和 Google Lens 的「完全匹配」排成两列。Google 侧栏展开或收起后，卡片跟着可用空间调整。窄窗口使用单列。

- 搜索结果右上角显示连续编号。图片集合和问答模块不占号。
- 在 Google 夜间模式下，卡片使用深色背景、更清晰的边线和浅色编号。
- Lens 的「全部」页面让图片集合占整行，网页结果保留两列。
- Google 图片搜索和 Lens 的「视觉匹配」使用原生布局。
- 侧栏在刷新前已展开时，首次收起会同步 Google 的原生 Logo 状态。

### 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. 打开 [google-search-cards.user.js](./google-search-cards.user.js)，用 **Raw** 进入安装界面，也可以复制文件内容到 Tampermonkey 的新脚本。
3. 如果还在使用旧版脚本或同类 Stylus 样式，先停用旧版，再刷新 Google 搜索结果页。

支持 `google.com`、`google.ca`、`google.co.uk` 和 `google.com.hk` 的 `www` 搜索页面。脚本只在本地调整页面布局，不采集或发送查询。

这份独立实现以 MIT 许可证发布。感谢 [iwyvi 的多栏搜索样式](https://userstyles.world/style/3155) 提供的灵感。

## English

Display Google web, news, video, and Lens Exact matches results in two columns. Cards resize when the Google sidebar opens or closes. Narrow windows use one column.

- Results have consecutive numbers in the top right. Image collections and question modules do not count toward the sequence.
- In Google's dark theme, cards have a dark surface, a clearer outline, and pale numbers.
- In Lens All, image collections span the full row and web results stay in two columns.
- Google Images and Lens Visual matches retain Google's layout.
- After reloading with the sidebar expanded, the first close synchronizes Google's native logo state.

### Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open [google-search-cards.user.js](./google-search-cards.user.js) and choose **Raw** to install it, or paste the file into a new Tampermonkey script.
3. Disable any older copy of the script or conflicting Stylus style, then refresh your Google search results.

Supports the `www` search pages on `google.com`, `google.ca`, `google.co.uk`, and `google.com.hk`. The script changes layout locally and does not collect or send queries.

This independent implementation is available under the MIT License. Thanks to [iwyvi's multi-column search style](https://userstyles.world/style/3155) for the inspiration.
