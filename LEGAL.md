# Legal and licensing

## Project license

Meow Table’s original source code and artwork are distributed under the [GNU Affero General Public License version 3](LICENSE). The root package identifies the license as `AGPL-3.0-only`. The license text governs copying, modification, and distribution. Dependencies and separately licensed materials retain their own terms. [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html)

The hosted HTML records the source URL for the exact revision deployed to Cloudflare in the `meow-table-source` metadata field. If you run a modified version over a network, provide its users with access to the corresponding source as required by Section 13. For a fork, review the source URL and licensing notices before publishing. [Section 13](https://www.gnu.org/licenses/agpl-3.0.html#section13) · [Deployment guide](docs/deployment.md)

## Branding and references

Meow Table is an independent project. Third-party game and publisher names appear for identification and comparison. The publisher’s reference PDF is linked externally, and its content and any third-party logos remain subject to their respective rights. The project license applies to the project’s own work. [Branding and asset provenance](docs/release-and-licensing.md)

## Hosted play

The game accepts a display name and uses a room code and a session token to connect and restore a seat. The browser keeps the token in session storage. The hosted Worker stores room and match state in a Cloudflare Durable Object and uses the connecting IP address for rate limiting. The application deletes its room record when no player seats remain. Hosting infrastructure has its own data handling. [Architecture](docs/architecture.md)

For a licensing or attribution concern, contact the maintainers through [GitHub Issues](https://github.com/visionarycoder7/Meow-Table-Card-Game/issues). Request a private channel before sharing sensitive material. See the [Security Policy](SECURITY.md) for security reports.
