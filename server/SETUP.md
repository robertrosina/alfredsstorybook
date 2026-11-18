# One-time owner setup

Other people will use their own GitHub accounts to sign in. Only the site owner performs this setup. Keep the GitHub App private key and client secret out of source control and chat messages.

## 1. Prepare the private data repository

Use a **private GitHub repository** containing your existing `journal.json` and `media/` directory. Keep their contents intact. If this is a completely new journal, copy the contents of `repository-template/` into the repository root and commit them first. The branch must already exist.

If your journal lives in a subfolder such as `docs/`, keep it there and configure that folder below. The app still exposes protected media at `/media/` on its own URL.

The signed-in version is accessed through its Cloudflare app URL. A public GitHub Pages URL exposes published files independently of these access controls. Remove any public publication of private journal data. Files already downloaded or copied by others cannot be recalled by changing hosting settings.

## 2. Create the server and database

Install a current Node.js release, then open a terminal in the extracted package folder:

```sh
npm install
npx wrangler login
npx wrangler d1 create alfreds-storybook-auth
```

Copy the database ID printed by the last command into `database_id` in `wrangler.toml`. Keep the binding name `DB`.

```sh
npx wrangler d1 migrations apply alfreds-storybook-auth --remote
npm run deploy
```

This first deployment gives you an HTTPS app URL such as `https://alfreds-storybook.YOUR-SUBDOMAIN.workers.dev`. Until configuration is complete it displays “Owner setup required”.

## 3. Register the GitHub App

In GitHub, open **Settings → Developer settings → GitHub Apps → New GitHub App**.

1. Choose a unique app name, such as `Alfred Storybook YOUR-USERNAME`.
2. Set the homepage URL to your deployed HTTPS app URL.
3. Set the user authorization callback URL to `https://YOUR-APP-URL/_auth/callback`.
4. Disable webhooks; this application does not use them.
5. Under repository permissions, set **Contents: Read and write**. Metadata read access is supplied by GitHub. Leave other permissions unselected.
6. Make the GitHub App available to **Any account**, so invited people can authorize sign-in. This makes the app registration public; your data repository remains private and the Storybook access list still controls entry.
7. Create the app. Note its **Client ID** and generate a **client secret**.
8. Generate and download its private key (`.pem`).
9. Choose **Install App**, install it on the account holding the journal, and select **only your Storybook repository**. Note the installation ID from the installation settings URL, which ends with `/installations/NUMBER`.

People viewing or contributing through your Storybook do not install this app on their own repositories.

## 4. Enter the configuration

Update these values in `wrangler.toml`:

| Setting | Value |
| --- | --- |
| `GITHUB_OWNER` | GitHub account or organisation holding the journal |
| `GITHUB_REPO` | Private repository name |
| `GITHUB_BRANCH` | Existing branch, usually `main` |
| `GITHUB_PROJECT_FOLDER` | Empty for the root, or a folder such as `docs` |
| `GITHUB_CLIENT_ID` | GitHub App Client ID |
| `GITHUB_INSTALLATION_ID` | Installation ID from step 3 |
| `ADMIN_USERS` | Your GitHub username; comma-separate additional owners |
| `ALLOW_PUBLIC_REPOSITORY` | Keep `false` for controlled viewing |

Store the two secrets through Wrangler:

```sh
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GITHUB_PRIVATE_KEY
```

Supply the client secret to the first prompt. Supply the **complete PEM**, including BEGIN/END lines, to the second. You can also redirect the PEM file into the second command with your shell. Keep the downloaded private key safely outside the package folder. GitHub’s downloaded RSA key format is supported.

Then deploy the completed configuration:

```sh
npm run deploy
```

The GitHub App must be allowed to update the configured branch. If repository rules require pull requests or signed commits, choose a suitable dedicated journal branch or configure an appropriate app allowance. The server always performs non-force updates and checks the previous head.

## 5. Grant access

1. Open the Cloudflare app URL and select **Sign in with GitHub**.
2. Authorize the GitHub App. Your configured owner username has automatic owner access.
3. Open **Your account** in the Storybook header.
4. Enter another person’s exact GitHub username and select **Viewer** or **Contributor**.
5. Give that person the app URL. They sign in with their own GitHub account.

An unapproved account sees an approval message. Removing its access blocks subsequent requests, including media requests. Sessions last seven days; people sign in again after expiration. Owner usernames are controlled in `wrangler.toml` and require redeployment to change.

All contributors currently share editing rights over the journal. Per-entry ownership, invitations by email and individual private journals are outside this edition.

## Check the deployed site

- Signed out: the root shows the sign-in page; opening `/journal.json` or a media URL fails.
- Owner: add a test entry and photo. Verify the new commit, `journal.json`, and dated media path in the private repository.
- Viewer in a separate browser: browse photographs; editing controls are hidden.
- Contributor: add/edit an entry and change the profile photograph.
- Remove a viewer’s access, then refresh its page: access should be refused.

These live checks depend on your GitHub App registration and Cloudflare deployment. The included automated tests use simulated GitHub responses.

## Troubleshooting

- **Owner setup required:** check database binding and all required variables/secrets.
- **Callback mismatch:** GitHub’s callback URL must exactly match the deployed origin plus `/_auth/callback`.
- **Access needs approval:** check the username in `ADMIN_USERS` or grant it through the owner account panel.
- **GitHub App installation error:** check installation ID, repository selection, Contents permission and private key.
- **Missing journal:** confirm `journal.json` exists on the configured branch and under the configured folder.
- **Branch changed:** reload before saving again. Each contributor’s draft remains in their browser.
- **Usage limits:** check Cloudflare’s Worker/D1 dashboard and GitHub API limits. Large collections can need a different media-storage design later.

## References

- [GitHub App registration](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
- [GitHub user authorization](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Cloudflare authenticated static assets](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare Worker limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
