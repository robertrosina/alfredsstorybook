# Alfred’s Storybook — GitHub sign-in edition

A shared chronology of Alfred’s life, with stories, photographs, profile-photo history, and a 1 GB current-file budget meter.

The owner completes the deployment in **SETUP.md** once. Afterwards, approved people sign in with their own GitHub accounts. The owner grants **Viewer** or **Contributor** access from **Your account**. Removing access takes effect on the next request.

- **Owner:** view, edit, upload, and manage approved usernames.
- **Contributor:** view, add/edit entries, and upload/remove photographs.
- **Viewer:** browse the chronology and photographs.

Entries and images live in your private GitHub repository. The server uses a GitHub App installation to update that repository. Contributors do not need repository tokens or direct repository access. Photographs retain the existing `/media/YYYY/MM/DD/` organisation and replaceable `/media/profile/profile.jpg`.

This package runs through a Cloudflare Worker and D1. Uploading its `index.html` to GitHub Pages alone does not activate sign-in. Your existing journal and media remain in their repository; deployable application files are separate.

## Included

- `public/index.html`: the Storybook interface.
- `worker.mjs`: sign-in, session checks, role management, protected media and GitHub writes.
- `migrations/0001_auth.sql`: authentication database.
- `wrangler.toml`: deployment configuration.
- `repository-template/`: empty journal and media folders for a new installation only.
- `test/`: executable authentication and integration tests.
- `managed-client.js`: reference copy of the managed client already embedded in `public/index.html`. After editing it, update the embedded copy as well.

## Data and limits

D1 holds authentication states, sessions, access grants and short-lived Git transaction records. Stories and media live in GitHub. Drafts and recovery records stay in each contributor’s browser, separated by repository and signed-in username. Shared entry edits use revision checks; refresh if another contributor has saved first.

The meter measures the current journal and media snapshot against an application budget of 1 GB. Git history retains earlier committed images, including replaced or deleted photographs; deleting a timeline photo does not erase Git history or shrink all repository history. Repository history can therefore occupy more space than the meter shows. Periodic export/download remains advisable.

An approved viewer can save photographs they can view. Removing account access prevents future app requests; previously downloaded files remain with their recipient.

Cloudflare and GitHub usage limits still apply. The package does not enable a paid subscription. Review their current limits before deployment, and monitor usage as the collection grows.

## Validation

Run `npm test` with Node.js 22.13 or newer (uses the built-in SQLite module). Server tests exercise real Web Crypto and SQLite, with mocked GitHub responses. They cover OAuth PKCE, single-use state, cookies, CSRF, revocation, viewer restrictions, protected media, path restrictions and safe commit updates. Live OAuth and deployment require the owner’s actual accounts and have not been verified in this package.
