export const externalLinks = {
  announcementFeishuUrl: "",
  communityFeishuUrl: "https://scn96l2kzmbn.feishu.cn/wiki/BsbGwOmyvi3tn0kcHQrcPMEvnDc",
  authorNoteFeishuUrl: "https://scn96l2kzmbn.feishu.cn/wiki/RXc7wH8Uqi4tfkkHHc7crbjUnoh",
};

const EXTERNAL_LINKS_BY_ENTRY = {
  announcement: {
    label: "公告",
    configKey: "announcementFeishuUrl",
  },
  community: {
    label: "建院社区",
    configKey: "communityFeishuUrl",
  },
  author: {
    label: "作者的话",
    configKey: "authorNoteFeishuUrl",
  },
};

export function externalLinkForEntry(id) {
  const config = EXTERNAL_LINKS_BY_ENTRY[id];
  if (!config) return null;
  return {
    ...config,
    url: externalLinks[config.configKey] ?? "",
  };
}

export function hasExternalLink(id) {
  return Boolean(externalLinkForEntry(id)?.url);
}

export function isExternalLinkEntry(id) {
  return Boolean(EXTERNAL_LINKS_BY_ENTRY[id]);
}
