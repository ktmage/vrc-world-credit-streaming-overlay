import { WORLD_CHANGED_EVENT, WorldInfoSchema, type WorldInfo } from "@/schema";

const AVAILABLE_STYLES = new Set(["card", "topbar"]);

// URL の ?style=<name> に応じて同梱スタイルシートを読み込む。未指定・不正値は素の HTML のまま。
function applyStyleFromUrl() {
  const requested = new URL(location.href).searchParams.get("style");
  if (!requested || !AVAILABLE_STYLES.has(requested)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `/styles/${requested}.css`;
  document.head.append(link);
}

applyStyleFromUrl();

const thumb = document.getElementById("thumb") as HTMLImageElement;
const worldName = document.getElementById("world-name")!;
const authorName = document.getElementById("author-name")!;

function render(world: WorldInfo) {
  thumb.src = world.imageUrl;
  thumb.hidden = false;
  worldName.textContent = world.name;
  const by = document.createElement("span");
  by.className = "by";
  by.textContent = "by ";
  authorName.replaceChildren(by, document.createTextNode(world.authorName));
}

const events = new EventSource("/events");
events.addEventListener(WORLD_CHANGED_EVENT, (event) => {
  const parsed = WorldInfoSchema.safeParse(JSON.parse(event.data));
  if (!parsed.success) {
    console.warn(`invalid ${WORLD_CHANGED_EVENT} payload:`, parsed.error);
    return;
  }
  render(parsed.data);
});
