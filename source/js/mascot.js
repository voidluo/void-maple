/**
 * web-mascot 桌宠初始化
 * 项目：https://github.com/CommentOut64/web-mascot
 * 引擎遵循 GPL-3.0-or-later，内置宠物包（Neuron / Eviling）遵循 CC-BY-NC-SA-4.0，请勿用于商业用途。
 */
import { configure, createMascot } from "../web-mascot/index.js";

// 从当前脚本位置推导资源地址，兼容 Hexo 部署在域名子路径下的情况。
const mascotBaseUrl = new URL("../web-mascot/", import.meta.url);

configure({
    assets: new URL("mascot_pack", mascotBaseUrl).href,
    animationConfigUrl: new URL("animation.config.json", mascotBaseUrl).href
});

const MASCOT_PACKS = ["Neuron", "Eviling"];
const MASCOT_Z_INDEX = "900";
let initialized = false;

function isMobileDevice() {
    return /Android|BlackBerry|IEMobile|iPad|iPhone|iPod|Mobile|Opera Mini|Windows Phone/i.test(navigator.userAgent)
        || window.matchMedia("(pointer: coarse)").matches;
}

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function raiseMascots() {
    // 引擎当前为每只宠物创建 fixed + grab 根节点；集中处理并兼容延迟创建。
    document.querySelectorAll("body > div").forEach((element) => {
        const style = element.style;
        if (style.position === "fixed" && style.cursor === "grab") {
            style.zIndex = MASCOT_Z_INDEX;
        }
    });
}

function watchMascotLayers() {
    raiseMascots();
    const observer = new MutationObserver(raiseMascots);
    observer.observe(document.body, { childList: true });
    window.setTimeout(() => observer.disconnect(), 5000);
}

async function initMascots() {
    if (initialized || isMobileDevice() || prefersReducedMotion()) return;
    initialized = true;

    try {
        // 两只桌宠一起加载；使用 allSettled，避免一只资源异常导致另一只也无法显示。
        const results = await Promise.allSettled(
            MASCOT_PACKS.map((pack) => createMascot({ container: document.body, pack }))
        );
        results.forEach((result, index) => {
            if (result.status === "rejected") {
                console.warn(`[web-mascot] ${MASCOT_PACKS[index]} 初始化失败：`, result.reason);
            }
        });
        watchMascotLayers();
    } catch (err) {
        initialized = false;
        console.warn("[web-mascot] 桌宠初始化失败：", err);
    }
}

function scheduleInit() {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(initMascots, { timeout: 2000 });
    } else {
        window.setTimeout(initMascots, 200);
    }
}

scheduleInit();
