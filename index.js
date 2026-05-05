import * as login from "./loginLambda.js";
import * as register from "./registerLambda.js";
import * as music from "./musicSearchLambda.js";
import * as subscribe from "./subscribeLambda.js";
import * as getSubs from "./getSubscriptionsLambda.js";
import * as deleteSub from "./deleteSubscriptionLambda.js";

export const handler = async (event) => {

    const path = event.rawPath || event.path || "";
    const method = event.requestContext?.http?.method || event.httpMethod;

    if (route === "/login" && method === "POST") {
        return login.handler(event);
    }

    if (route === "/register" && method === "POST") {
        return register.handler(event);
    }

    if (route === "/music/search" && method === "GET") {
        return music.handler(event);
    }

    if (route === "/subscribe" && method === "POST") {
        return subscribe.handler(event);
    }

    if (route === "/subscriptions" && method === "GET") {
        return getSubs.handler(event);
    }

    if (route === "/subscription" && method === "DELETE") {
        return deleteSub.handler(event);
    }

    return {
        statusCode: 404,
        body: JSON.stringify({ message: "Not found" })
    };
};