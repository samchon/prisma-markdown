import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export default (): void => {
  const content = fs.readFileSync(path.join(__dirname, "links.md"), "utf8");
  for (const expected of [
    "Owns many [posts](#post); see also [UserProfile](#user_profiles).",
    "Legacy [users](#users); identifier [user identifier](#users).",
    "Profile of [User](#users).",
    "Posts by [users](#users).",
    "Identifier of [User](#users).",
    "Author [User.id](#users).",
    "Tagged with [tags](#posttags) through [_PostToTag](#_posttotag).",
    "Pair relationship table between [Post](#post) and [PostTags](#posttags)",
  ])
    assert.ok(
      content.includes(expected),
      `Missing generated content: ${expected}`,
    );
  assert.ok(!content.includes("{@link"), "An inline link was left unconverted");

  const headings = new Set(
    Array.from(content.matchAll(/^#{1,6} (.+)$/gm), ([, heading]) =>
      heading.replace(/`/g, "").toLowerCase().replace(/ /g, "-"),
    ),
  );
  for (const [, fragment] of content.matchAll(/\]\(#([^)]*)\)/g))
    assert.ok(headings.has(fragment), `Missing heading for #${fragment}`);
};
