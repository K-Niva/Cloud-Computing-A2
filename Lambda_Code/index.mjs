import * as login from "./loginLambda.mjs";
import * as register from "./registerLambda.mjs";
import * as music from "./musicSearchLambda.mjs";
import * as subscribe from "./subscribeLambda.mjs";
import * as getSubs from "./getSubscriptionsLambda.mjs";
import * as deleteSub from "./deleteSubscriptionLambda.mjs";

export const handler = async (event) => {

    console.log("EVENT:", JSON.stringify(event));

    const path = event.rawPath || event.path || "";
    const method = event.requestContext?.http?.method || event.httpMethod;

    // =========================
    // AUTH
    // =========================
    if (path === "/login" && method === "POST") {
        return login.handler(event);
    }

    if (path === "/register" && method === "POST") {
        return register.handler(event);
    }

    // =========================
    // MUSIC SEARCH
    // =========================
    if (path === "/music/search" && method === "GET") {
        return music.handler(event);
    }

    // =========================
    // SUBSCRIPTIONS
    // =========================
    if (path === "/subscribe" && method === "POST") {
        return subscribe.handler(event);
    }

    if (path === "/subscriptions" && method === "GET") {
        return getSubs.handler(event);
    }

    if (path === "/subscription" && method === "DELETE") {
        return deleteSub.handler(event);
    }

    return {
        statusCode: 404,
        body: JSON.stringify({ message: "Route not found" })
    };
};