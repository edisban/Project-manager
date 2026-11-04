package com.edis.backendproject.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Exercises the browser flow over real HTTP with a real cookie jar, exactly like the SPA:
 * fetch the XSRF-TOKEN cookie, echo it in the X-XSRF-TOKEN header, receive the HttpOnly auth cookie,
 * use it, and sign out.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "jwt.secret=integration-test-secret-that-is-long-enough-1234567890",
        "app.admin.username=admin",
        "app.admin.password=admin-password-123"
})
class CsrfCookieFlowIT {

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        TestContainers.register(registry);
    }

    @LocalServerPort
    int port;

    private final CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
    private final HttpClient http = HttpClient.newBuilder().cookieHandler(cookies).build();

    @Test
    void browserStyleSignUpSignInAndSignOut() throws Exception {
        String username = "flow_" + UUID.randomUUID().toString().substring(0, 8);
        String credentials = "{\"username\":\"" + username + "\",\"password\":\"correct-horse-battery\"}";

        // 1. Without a CSRF token, state-changing requests are rejected.
        assertThat(send("POST", "/api/auth/register", credentials, false).statusCode()).isEqualTo(403);

        // 2. Fetch the CSRF cookie, then register and sign in with the header set.
        assertThat(send("GET", "/api/auth/csrf", null, false).statusCode()).isEqualTo(204);
        assertThat(cookie("XSRF-TOKEN")).isNotNull();
        assertThat(send("POST", "/api/auth/register", credentials, true).statusCode()).isEqualTo(201);

        HttpResponse<String> login = send("POST", "/api/auth/login", credentials, true);
        assertThat(login.statusCode()).isEqualTo(200);
        assertThat(login.body()).doesNotContain("\"token\"");
        HttpCookie auth = cookie("access_token");
        assertThat(auth).isNotNull();
        assertThat(auth.isHttpOnly()).isTrue();

        // 3. The cookie authenticates subsequent requests.
        HttpResponse<String> me = send("GET", "/api/auth/me", null, false);
        assertThat(me.statusCode()).isEqualTo(200);
        assertThat(me.body()).contains(username);

        // 4. Sign out clears the cookie; the session is gone.
        assertThat(send("POST", "/api/auth/logout", null, true).statusCode()).isEqualTo(200);
        assertThat(send("GET", "/api/auth/me", null, false).statusCode()).isEqualTo(401);
    }

    private HttpResponse<String> send(String method, String path, String body, boolean withCsrfHeader)
            throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .method(method, body == null
                        ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(body))
                .header("Content-Type", "application/json");
        HttpCookie xsrf = cookie("XSRF-TOKEN");
        if (withCsrfHeader && xsrf != null) {
            request.header("X-XSRF-TOKEN", xsrf.getValue());
        }
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpCookie cookie(String name) {
        return cookies.getCookieStore().getCookies().stream()
                .filter(c -> c.getName().equals(name) && !c.getValue().isEmpty())
                .findFirst()
                .orElse(null);
    }
}
