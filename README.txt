DHILLON TENTS — WEBSITE FILES

OPEN LOCALLY: Choose Extract All / Unzip, open the extracted dhillon-tents folder, then open index.html in your browser. Keep the entire folder together. Do not open a page directly inside the ZIP or in a document preview, which may block scripts or lose access to the other pages.

PUBLISH ON VERCEL: Upload the contents of this dhillon-tents folder to your repository root. Keep api/, assets/, package.json, vercel.json and all HTML/CSS/JavaScript files together. No build is required. The contact endpoint needs Vercel Functions and the email environment variables below; a plain static host cannot run it.

Home: index.html
Book Now: book-now.html
Cart: cart.html
Other sections: rentals.html, tent-size-planner.html, gallery.html, about.html, faq.html and contact.html.

KEYWORD LANDING PAGES: Five new separate HTML pages stay out of the main navigation: rental-guides.html (guide index), backyard-tent-rentals-brampton.html, party-tent-rentals.html, tent-rental-prices.html and tent-size-guide.html. They are public, readable pages, not hidden text or content shown only to search engines. Contextual links from FAQs and the relevant service pages make them discoverable without crowding the header. All five are included in sitemap.xml with unique titles, descriptions, canonical URLs, breadcrumbs and page structured data. The new pages reuse your real photos, shared navigation, quote drawer and Booqable cart/booking links.

KEYWORD GROUPING FROM YOUR PDF:
- Brampton tent rental(s), tent rental Brampton, Brampton event rentals: existing brampton-tent-rentals.html.
- Backyard tent rental Brampton: backyard-tent-rentals-brampton.html.
- Party tent rental Brampton, Brampton party rentals, birthday party, graduation party, baby shower and outdoor party tent searches: party-tent-rentals.html. These event types have different advice on one useful page rather than duplicate pages for each wording.
- Tent rental Brampton prices and Toronto tent rental prices: tent-rental-prices.html. No prices were invented; it explains quote components and links to live booking for dated product pricing.
- Caledon tent rental(s) and Caledon event rentals: existing caledon-tent-rentals.html.
- Mississauga tent rentals, tent rental Mississauga and Mississauga event/party rentals: existing mississauga-tent-rentals.html.
- Milton tent rental: existing milton-tent-rentals.html.
- Toronto tent rental(s) and greater Toronto tent rentals: existing toronto-tent-rentals.html and gta-tent-rentals.html.
- Chair rental Brampton, folding chair rental Brampton and chair and table rental Brampton: existing chair-table-rentals.html, expanded with furniture advice.
- Tent size variations: tent-size-guide.html, with all 11 sizes and the approved guest/table formulas. The guide supports planning; the PDF did not establish search demand for each size term.
- Wedding-related phrases stay grouped on wedding-tent-rentals.html.
- Excluded wheelchair rental (not your service) and Kijiji-specific intent (no verified listing). Unconfirmed service areas and tent types were not added. N/A difficulty and no keyword ideas do not establish easy rankings or zero demand.

THIS REVISION: All 25 pages passed local link/anchor, metadata, structured-data, script and sitemap validation. All 21 automated tests passed, including 5 contact API tests with a mocked email provider. A DOM integration check covered direct sending, rental quantities, planner notes, retries and form state. New-page desktop/mobile visual appearance, search indexing, rankings and live transactions remain unverified. No public deployment was made. Upload the complete extracted contents to your GitHub repository and commit to deploy through your connected Vercel project. Ensure canonical URLs and the sitemap use the domain that will actually serve the site; currently they remain https://dhillontents.com/.

SEO UPDATE: The gallery has a Brampton/GTA title and introduction, visible breadcrumbs, descriptive captions and image alternatives, relevant links to rental and service-area pages, and a quote call to action. Eighteen photos are described in ImageGallery structured data and included in the image sitemap. Six original-resolution photos have responsive image candidates for smaller screens. These changes follow useful navigation patterns from the reference site and Google image/link guidance; no competitor text or images were copied. Search rankings, Google indexing and rich-result display are not verified. Confirm the final domain before submission to Search Console; canonical URLs currently use https://dhillontents.com/.

PHOTO UPDATE: The homepage's original light gallery and planning backgrounds have been restored. The sharper original-resolution carousel photos and improved framing remain. About and Contact now use tent-photo backgrounds with dark overlays. The contact form retains its opaque white panel and readable inputs. Upload the extracted folder contents to the existing GitHub repository, replacing matching files and preserving the assets folder; commit to main to deploy through Vercel. The complete ZIP contains every page and required asset. Static checks passed; desktop and mobile browser appearance for this background revision remains unverified.

The homepage retains the branded intro and scrolling tent reveal. Its six-photo event carousel has smooth transitions, arrow controls, photo dots, a counter, keyboard and native swipe support, plus pause/play. Autoplay pauses during interaction and when offscreen, and starts disabled for reduced-motion preferences. All 25 pages are separate HTML files, with shared CSS, JavaScript and optimized local images. Each page has readable content, a unique title, description and canonical URL. Navigation uses direct HTML links; native browser View Transitions enhance them where supported. The quote list, event details, planner, gallery and mobile navigation are connected across pages.

The planner opens with guest count, seated/standing choices and one suggested tent with a direct quote button. Tables and chairs are optional. The full layout editor is collapsed by default, preserves saved layouts, and can import the quick suggestion with Undo available. Quick estimates and custom layouts are saved separately in the same browser tab.

PLANNER: All 11 sizes are included: 10x10, 20x20, 20x30, 20x40, 20x60, 20x80, 40x40, 40x60, 40x80, 40x100 and 40x120 ft. Capacity estimates use 40 seated or 60 standing guests per 400 sq ft. Table estimates scale from 9 six-foot folding tables OR 4 five-foot round tables per 400 sq ft, rounded down. Folding tables use a 6x2.5 ft footprint. Table counts are planning estimates, not a guaranteed furnished seating capacity.

Add tents and tables, drag or use the X/Y and move buttons, rotate, remove, undo and redo. Moving or rotating a tent carries its tables. Invalid overlaps and placements outside the configured space are rejected. Save layout to quote or Inquire now transfers the actual quantities. The layout, quote and event draft persist in the same browser tab. For reliable persistence, serve these files over HTTP/HTTPS; browser rules for local file storage vary.

VERIFICATION: Desktop and mobile-width browser checks covered planner movement, form visibility, navigation and saved quotes. All tent sizes, table arrangements, geometry rules and quote replacement have automated checks; touch-pointer event handling has a DOM test. Physical touchscreen devices and Safari/iOS remain unverified. The live Booqable catalog and calendar popup were checked. No payment or live email delivery was tested. Contact API tests use a mocked email provider; a production test is required after account configuration.

Booqable renders directly on Book Now and Cart. Its official SDK and cart button are included on every page. No enclosing booking iframe or legacy booking website redirect is used. The quote-request list is separate from the Booqable checkout cart. Booqable needs an internet connection and your active merchant configuration. Local file and document previews may not support its store and checkout. Verify live availability and checkout on your HTTPS domain. Availability and payment completion remain subject to your Booqable account; no test booking or payment was submitted.

CONTACT UPDATE: Send quote request posts the customer details, saved rental list and planner summary to /api/contact. A Vercel function sends the message through Resend to dhillontents@gmail.com. Configure RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel before deploying. The sender must use your verified Resend domain, while Reply-To is the customer email. The WhatsApp alternative still opens a draft. Direct sending includes visible progress/errors, retained form and quote data, duplicate-submit protection, server validation, a bot-trap field and a best-effort per-instance burst limit. The latter is not a global distributed rate limit. Add a Vercel Firewall rule for /api/contact if stronger abuse control is required. Read CONTACT-SETUP.txt for exact steps. No customer acknowledgment email is sent automatically.

Branding is Dhillon Tents. Instagram links to @dhillontents. Every business email destination is dhillontents@gmail.com. The existing phone number is +1 (416) 893-2626. Homepage headings use modern sans-serif typography; the contact form has explicit readable labels, entered text and buttons.

The canonical domain remains https://dhillontents.com/ from your uploaded website. If the final domain differs, update absolute URLs in all HTML files, sitemap.xml and robots.txt together before public installation. The cart is noindex and is excluded from the sitemap. Arrange permanent redirects from replaced business URLs in your hosting configuration when launching.

No changes to your existing business-domain hosting, DNS or merchant account are made by downloading this ZIP.
