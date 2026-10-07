import axios from "axios";
const graph = () =>
  `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v24.0"}`;
export async function publishFacebook(d) {
  const text = d.contentOverride || d.post.content;
  const media = d.post.media[0];
  let r;
  if (media?.type.startsWith("image"))
    r = await axios.post(
      `${graph()}/${d.socialAccount.platformAccountId}/photos`,
      {
        url: media.url,
        caption: text,
        access_token: d.socialAccount.accessToken,
      },
    );
  else
    r = await axios.post(
      `${graph()}/${d.socialAccount.platformAccountId}/feed`,
      { message: text, access_token: d.socialAccount.accessToken },
    );
  return { id: r.data.id || r.data.post_id };
}
export async function publishInstagram(d) {
  const media = d.post.media[0];
  if (!media)
    throw new Error("Instagram publishing requires media in this MVP");
  const caption = d.contentOverride || d.post.content;
  const create = await axios.post(
    `${graph()}/${d.socialAccount.platformAccountId}/media`,
    {
      image_url: media.url,
      caption,
      access_token: d.socialAccount.accessToken,
    },
  );
  const pub = await axios.post(
    `${graph()}/${d.socialAccount.platformAccountId}/media_publish`,
    { creation_id: create.data.id, access_token: d.socialAccount.accessToken },
  );
  return { id: pub.data.id };
}
