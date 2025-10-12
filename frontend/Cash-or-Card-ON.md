# Cash-or-Card-ON

Restaurant Payment Methods Sharing Website

Backend:

- Multi-Tier User Features:
    - No login:
        - Search Restaurants:
        - Filtering by Payments method/Category/Verified/Location range/Open Now
        - Sorting by Payments method/Latest updated/Location distance
    - Registered User:
        - Add Cash discounts and Payment method info
        - Vote if the displayed information is trustable or not
    - Admin User:
        - Mark restaurant payment info as verified (verified tag)
        - Remove Misleading restaurant information
- Data Trustability Voting System (score of trustable based on how many people reported/voted)
- Data pipeline:
    - from Yelp/Google Map to gain basic restaurant info, (running nightly)
    - scraping potential payment info from Google user reviews (running weekly due to cost concern) (optional feature)

Frontend:

- Single page web Dashboard showing restaurant info with search bar and filtering option, responsive design
    - Card View
    
    ```markdown
    ┌─────────────────────────────────────────────────────────────────────┐
    │  🍽️ Restaurant Finder                    [Search: ____________] 🔍 │
    │                                           [Login] [Sign Up]         │
    ├─────────────────────────────────────────────────────────────────────┤
    │  Filters: [All Cities ▼] [Category ▼] [Payment Method ▼]            │
    └─────────────────────────────────────────────────────────────────────┘
    
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ 🏪 [Logo/Image]  │  │ 🏪 [Logo/Image]  │  │ 🏪 [Logo/Image]  │
    │                  │  │                  │  │                  │
    │ Restaurant Name  │  │ Restaurant Name  │  │ Restaurant Name  │
    │ ⭐⭐⭐⭐⭐    │  │ ⭐⭐⭐⭐        │  │ ⭐⭐⭐⭐⭐    │
    │                  │  │                  │  │                  │
    │ 📍 North York    │  │ 📍 Downtown TO   │  │ 📍 Scarborough   │
    │ 🍕 Italian       │  │ 🍜 Asian         │  │ 🍔 Fast Food     │
    │                  │  │                  │  │                  │
    │ 💳 Visa Mastercard│ │ 💳 Cash Only     │  │ 💳 All Cards     │
    │ 💰 5% Cash Disc. │  │ 💰 No Discount   │  │ 💰 3% Cash Disc. │
    │                  │  │                  │  │                  │
    │   [View Details] │  │   [View Details] │  │   [View Details] │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
    
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ 🏪 [Logo/Image]  │  │ 🏪 [Logo/Image]  │  │ 🏪 [Logo/Image]  │
    │ ...              │  │ ...              │  │ ...              │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
    ```
    
- Responsive View
    
    ```markdown
    ┌──────────────────────┐
    │ 🍽️ Restaurant Finder │
    │ [☰ Menu]    [Search] │
    ├──────────────────────┤
    │ [All Cities ▼]       │
    │ [Category ▼]         │
    │ [Payment ▼]          │
    ├──────────────────────┤
    │ ┌──────────────────┐ │
    │ │  🏪 [Logo]       │ │
    │ │                  │ │
    │ │  Restaurant Name │ │
    │ │  ⭐⭐⭐⭐⭐    │ │
    │ │  📍 North York   │ │
    │ │  🍕 Italian      │ │
    │ │  💳 All Cards    │ │
    │ │  💰 5% Discount  │ │
    │ │  [View Details]  │ │
    │ └──────────────────┘ │
    ├──────────────────────┤
    │ ┌──────────────────┐ │
    │ │  🏪 [Logo]       │ │
    │ │  (Next card...)  │ │
    │ └──────────────────┘ │
    └──────────────────────┘
    ```
    
- Pop up modal
    - allow user to view and edit detailed information (login user can only modify and vote acceptable payments  and cash discount)
    - Display:
        - Restaurant Name
        - Restaurant Logo/Picture
        - Full Address
            - Display:
                - Restaurant Name
                - Restaurant Logo/Picture
                - City: Which City (e.g. if it is located in north york, display north york instead of toronto)
                - Cash Discount
                - Acceptable Payments
        - Open hours
        - Category
        - Acceptable Payments (Capsule with vote count)
        - Cash discount (capsule with vote count)
    
    ```markdown
    ┌─────────────────────────────────────────────────────────────┐
    │  Restaurant Details                                    [X]  │
    ├─────────────────────────────────────────────────────────────┤
    │                                                             │
    │  ┌─────────────────────────────────────────────────────┐    │
    │  │         🏪 Restaurant Logo/Picture 🏪              │    │
    │  │              (Large Image)                          │    │
    │  └─────────────────────────────────────────────────────┘    │
    │                                                             │
    │  ╔═══════════════════════════════════════════════════════╗  │
    │  ║  🍴 RESTAURANT NAME (Large & Bold) 🍴                ║  │
    │  ╚═══════════════════════════════════════════════════════╝  │
    │                                                             │
    │  📍 Full Address 📍                                        │
    │  ─────────────────────────────────────────────────────────  │
    │  123 Main Street, Unit 456                                  │
    │  North York, ON M2N 5S7                                     │
    │  City: North York                                           │
    │                                                             │
    │  🕒 Open Hours 🕒                                          │
    │  ─────────────────────────────────────────────────────────  │
    │  Mon-Fri: 11:00 AM - 10:00 PM                               │
    │  Sat-Sun: 12:00 PM - 11:00 PM                               │
    │                                                             │
    │  🍽️ Category 🍽️                                            │
    │  ─────────────────────────────────────────────────────────  │
    │  [ Italian ] [ Pizza ] [ Pasta ]                            │
    │                                                             │
    │  💳 Acceptable Payments 💳                                 │
    │  ─────────────────────────────────────────────────────────  │
    │  [ Visa 👍 45 ]  [ Mastercard 👍 42 ]                      │
    │  [ Cash 👍 25 ]  [ Debit 👍 38 ] [ + Add Payment Method ]  │
    │                                                             │
    │  💰 Cash Discount 💰                                       │
    │  ─────────────────────────────────────────────────────────  │
    │  [ 5% Discount 👍 52 ]  [ 3% Discount 👍 18 ]              │
    │  [ No Discount 👍 8 ]   [ ✏️ Edit ] ← (if logged in)       │
    │                                                             │
    │              [ 🔙 Close ]  [ 📝 Edit Info ]                │
    │                    ↑                                        │
    │              (if logged in)                                 │
    └─────────────────────────────────────────────────────────────┘
    ```
    
- User account page
    
    ```markdown
    ┌─────────────────────────────────────────────────────────────┐
    │  🍽️ Restaurant Finder 🍽️          Welcome, John! [Logout]  │
    ├─────────────────────────────────────────────────────────────┤
    │  [Dashboard] [My Account] [Add Restaurant]                  │
    └─────────────────────────────────────────────────────────────┘
    
    ┌─────────────────────────────────────────────────────────────┐
    │  👤 My Account 👤                                          │
    ├─────────────────────────────────────────────────────────────┤
    │                                                             │
    │  Profile Information                                        │
    │  ──────────────────────────────────────────────────────     │
    │  Name:     [John Doe                              ]         │
    │  Email:    [john.doe@email.com                    ]         │
    │  Username: [johndoe123                            ]         │
    │                                                             │
    │  [ Update Profile ]                                         │
    │                                                             │
    ├─────────────────────────────────────────────────────────────┤
    │                                                             │
    │  My Contributions                                           │
    │  ──────────────────────────────────────────────────────     │
    │  • Restaurants Added: 3                                     │
    │  • Payment Methods Voted: 12                                │
    │  • Cash Discounts Voted: 8                                  │
    │  • Last Activity: Oct 9, 2025                               │
    │                                                             │
    ├─────────────────────────────────────────────────────────────┤
    │                                                             │
    │  Recent Activity                                            │
    │  ──────────────────────────────────────────────────────     │
    │  ✓ Voted on "Pizza Palace" - Visa accepted                  │
    │  ✓ Added "Sushi House" to database                          │
    │  ✓ Updated "Burger Joint" - Cash discount                   │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
    ```
    
- Admin Page (List View)

```markdown
┌─────────────────────────────────────────────────────────────────────────────┐
│  🍽️ Restaurant Finder - Admin Panel 🍽️          Admin User [Logout]        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Admin Panel] [Reports] [Users]                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│  Restaurant Management                         [+ Add New Restaurant]          │
├──────┬───────────────────┬────────────┬──────────┬─────────────┬───────────────┤
│ ID   │ Name              │ City       │ Category │ Status      │ Actions       │
├──────┼───────────────────┼────────────┼──────────┼─────────────┼───────────────┤
│ 001  │ Pizza Palace      │ North York │ Italian  │ ✓ Active    │ [✏️][👁️][🗑️]│
├──────┼───────────────────┼────────────┼──────────┼─────────────┼───────────────┤
│ 002  │ Sushi Master      │ Downtown   │ Japanese │ ✓ Active    │ [✏️][👁️][🗑️]│
├──────┼───────────────────┼────────────┼──────────┼─────────────┼───────────────┤
│ 003  │ Burger Haven      │ Scarborough│ Fast Food│ ⚠️ Pending  │ [✏️][👁️][🗑️]│
├──────┼───────────────────┼────────────┼──────────┼─────────────┼───────────────┤
│ 004  │ Taco Fiesta       │ Etobicoke  │ Mexican  │ ✓ Active    │ [✏️][👁️][🗑️]│
├──────┼───────────────────┼────────────┼──────────┼─────────────┼───────────────┤
│ 005  │ Noodle House      │ Markham    │ Asian    │ ❌ Inactive │ [✏️][👁️][🗑️]│
├──────┼───────────────────┼────────────┼──────────┼─────────────┼───────────────┤
│ ...  │ ...               │ ...        │ ...      │ ...         │ ...           │
└──────┴───────────────────┴────────────┴──────────┴─────────────┴───────────────┘

 Showing 1-10 of 245 restaurants    [ < Previous ] [ 1 2 3 ... 25 ] [ Next > ]

┌─────────────────────────────────────────────────────────────────────────────┐
│  Pending Reviews (3)                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  • "Dragon Wok" - Submitted by user123 on Oct 9    [Approve] [Reject]       │
│  • "Cafe Mocha" - Submitted by jane_doe on Oct 8    [Approve] [Reject]      │
│  • "BBQ Kingdom" - Submitted by foodlover on Oct 7  [Approve] [Reject]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

- (Optional) Map View/Card View toggle

```markdown
┌─────────────────────────────────────────────────────────────┐
│  🍽️ Restaurant Finder        [Search: ________] 🔍          │
│                              [🗺️ Map View] [📋 Card View]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         🗺️         INTERACTIVE MAP                         │
│                                                             │
│    📍                    📍         📍                    │
│          📍                                                │
│                   📍                    📍                 │
│                              📍                            │
│         📍                              📍                 │
│                                                             │
│    📍        📍                                            │
│                        📍         📍                       │
│                                              📍             │
│                                                             │
│  Legend: 📍 = Restaurant Location                           │
│  Click marker for details                                   │
│                                                             │
│  ┌─────────────────────────┐                                │
│  │ 🏪 Pizza Palace         │  ← Popup on marker click       │
│  │ ⭐⭐⭐⭐⭐            │                                │
│  │ 📍 North York           │                                │
│  │ [View Details]          │                                │
│  └─────────────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- User page to add/modify restaurant info and submit

```markdown
┌─────────────────────────────────────────────────────────────┐
│  📝 Add New Restaurant                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Basic Information                                          │
│  ──────────────────────────────────────────────────────     │
│  Restaurant Name *                                          │
│  [____________________________________________]              │
│                                                             │
│  Logo/Picture                                               │
│  ┌──────────────┐                                           │
│  │   [Upload]   │  [Choose File] No file chosen             │
│  │    Image     │                                           │
│  └──────────────┘                                           │
│                                                             │
│  Location *                                                 │
│  ──────────────────────────────────────────────────────     │
│  Street Address:  [_________________________________]        │
│  City:            [_________________________________]        │
│  Province:        [Ontario ▼]                               │
│  Postal Code:     [_________]                               │
│                                                             │
│  Operating Hours *                                          │
│  ──────────────────────────────────────────────────────     │
│  Monday:    [09:00] to [17:00]  [ ] Closed                  │
│  Tuesday:   [09:00] to [17:00]  [ ] Closed                  │
│  Wednesday: [09:00] to [17:00]  [ ] Closed                  │
│  (... etc for all days)                                     │
│                                                             │
│  Category *                                                 │
│  ──────────────────────────────────────────────────────     │
│  [✓] Italian  [ ] Chinese  [ ] Japanese  [ ] Fast Food      │
│  [ ] Mexican  [✓] Pizza    [ ] Vegetarian [ ] Other         │
│                                                             │
│  Payment Methods                                            │
│  ──────────────────────────────────────────────────────     │
│  [✓] Visa  [✓] Mastercard  [✓] Debit  [ ] Cash Only        │
│  [✓] American Express  [ ] Interac  [ ] Apple Pay           │
│                                                             │
│  Cash Discount                                              │
│  ──────────────────────────────────────────────────────     │
│  ( ) No Discount  ( ) 3%  (•) 5%  ( ) 10%  ( ) Custom: [__] │
│                                                             │
│            [ Cancel ]  [ Save Restaurant ]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Data Schema:

- Restaurant Table
    - id (index)
    - Restaurant Name (string)
    - Restaurant Logo/Picture (file storage)
    - Address (string)
    - Open hours (need to design what’s the best approach)
    - Catagory (Chinese/Korean/Japanese/Vienan/Thai/Italian/French, etc.)
    - Acceptable Payment Level (Cash/Debit/VISA/MASTERCARD/AMEX), default null, only show when verified is true
    - Cash Discount (Integer), default null, only show when verified is true
    - Verified Tag (Boolean)
    - Last modified
- Restaurant payment type vote
    - id
    - payment type (Cash/Debit/VISA/MASTERCARD/AMEX)
    - vote count (default 1)
- Restaurant cash discount vote
    - id
    - discount amount (percentage in integar)
    - vote count (default 1)
    
- User Data
    - Username
    - Email
    - Password
    - Role

Tech Stack:

Core Features:

- Containerization and Local Development: Docker and Docker Compose
- Database: PostgreSQL with persistent storage through Digital Ocean Volumes
- Deployment provider: Digital Ocean
- Orchestration Approach: Kubernetes
- Backend: Node.js with express framework
- Frontend: please suggest one
- Monitoring: digital Ocean

Advanced Features:

- Auto-scaling and high availability (e.g., configure Swarm/K8s to scale based on load).
- Security enhancements (e.g., authentication/authorization, HTTPS, secrets management).
- CI/CD pipeline (GitHub Actions)
    - [cloc](https://github.com/AlDanial/cloc) - to count lines of code
    - eslint - to scan syntax errors
    - build - node js build, and deploy to the runner locally through docker compose and run e2e test
    - unit test on backend api gateway
- Backup and recovery (e.g., automated database backups to digital ocean volume).
- Integration with external services (e.g., email notifications via SendGrid to notify a registered user that your restaurant info is verified by admin)

[Pre-built Data](https://www.notion.so/27a4834a9977804c81fef77db7351e29?pvs=21)

[DB Schema](https://www.notion.so/DB-Schema-2884834a997780c58171cb24d3f61a25?pvs=21)