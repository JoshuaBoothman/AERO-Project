# Home Page Revamp Implementation Plan

## Goal Description
Revamp the application's root landing page (`Home.jsx`) to provide a dedicated, informative front page for non-logged-in users. Currently, the home page auto-redirects to the current or next event. The new design will enable a static landing page featuring "Hero", "About", and other informational sections, populated with the text content extracted from the provided design documents.

## User Review Required
> [!IMPORTANT]
> **Auto-Redirect Removal**: This change will REMOVE the automatic redirection to `EventDetails`. Users visiting `/` will now see the new Home Page instead of being immediately taken to the active event.
> **Images**: I have extracted the text, but I will need you to provide the actual image files (e.g., Council Logo, Banner Backgrounds) as I cannot extract high-quality images from the PDF/DOCX myself. I will use placeholders for now.

## Proposed Changes

### Client (Frontend)

#### [MODIFY] [Home.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Home.jsx)
- **Remove Logic**: Remove the `useEffect` hook that automatically calculates the current/next event and redirects the user.
- **New Structure**: Implement a responsive landing page layout with the following sections:

    **1. Hero / Banner Section**
    -   **Background**: Full-width image (Placeholder).
    -   **Text**:
        -   "Australian Large Scale Models invites you to the Festival of Aeromodelling 2026"
        -   "4th – 12th of July 2026"
        -   "Inglewood Aerodrome"
    -   **CTA**: (Implied, e.g., "View Event" linking to `/events`)

    **2. About ALSM Section**
    -   **Content**:
        > Australian Large Scale Models (ALSM) began as a simple Facebook group, created by an individual with a passion for large scale model aircraft and a desire to share that passion with others. What started as a small online community has grown over more than a decade into one of the largest and most active aeromodelling groups in the world, now boasting over 16,200 members.
        >
        > In 2020, ALSM took the next step by hosting its first large scale flying event at Tin Can Bay. The success of that inaugural gathering laid the foundation for something much bigger. Since 2022, ALSM has proudly hosted the Festival of Aeromodelling annually in Inglewood, Queensland, each July.
        >
        > Today, the Festival of Aeromodelling is Australia’s largest RC aeromodelling event, attracting pilots and enthusiasts from across Australia and overseas. ALSM continues to celebrate craftsmanship, scale realism, and the shared love of flight that brings the aeromodelling community together.

    **3. ALSM's Premier Event Section**
    -   **Header**: "ALSM’S PREMIER EVENT"
    -   **Content**:
        > The Vision of the Festival of Aeromodelling started with members of the Australian Large Scale Models fulfilling the dream to be able to attend the World’s Largest RC Fun Fly, Joe Nall in the state of South Carolina, USA.
        >
        > It was from attending such an event that a group of like-minded Australian Aeromodellers came together to help recreate the equivalent for the Australian Aeromodelling Community, to which the Festival of Aeromodelling was born.

    **4. National & State Associations Section**
    -   **Intro Text**:
        > Can’t make it to an Australian Large Scale Models event, or new to aeromodelling? You can find local flying events and information on how to get into the hobby through the Model Aeronautical Association of Australia or via your state association below.
    -   **Layout**: Banner with logos (Placeholders) acting as links.
    -   **National**:
        -   **MAAA** (Model Aeronautical Association of Australia)
    -   **State Associations**:
        -   **MAAQ** (Queensland) - *Link: [https://maaq.org/](https://maaq.org/)*
        -   **ANSW** (New South Wales) - *Link: [https://nsw.aeromodellers.org.au/](https://nsw.aeromodellers.org.au/)*
        -   **ACTAA** (ACT) - *Link: [https://actaa.net.au/](https://actaa.net.au/)*
        -   **MASA** (South Australia) - *Link: [https://www.masa.org.au/](https://www.masa.org.au/)*
        -   **ANT** (Northern Territory) - *Link: [https://www.maaa.asn.au/about-us/state-associations/ant](https://www.maaa.asn.au/about-us/state-associations/ant)*
        -   **TMAA** (Tasmania) - *Link: [https://tasmodelaero.com/](https://tasmodelaero.com/)*
        -   **VMAA** (Victoria) - *Link: [https://www.vmaa.com.au/](https://www.vmaa.com.au/)*
        -   **AWA** (Western Australia) - *Link: [https://www.facebook.com/profile.php?id=100064786877751](https://www.facebook.com/profile.php?id=100064786877751)*

    **5. Footer / Thank You Section**
    -   **Content**:
        > We would like to say thank you to the Goondiwindi Regional Council for their ongoing support with Australian Large Scale Models.
    -   **Image**: Goondiwindi Regional Council Logo (Placeholder).

-   **Styling**: Use inline styles or specific CSS modules to match the "rich aesthetics" requirement (Vibrant colors, modern typography, responsive layout).

### Database
- **Status**: No changes required.
- **SQL Script**:
    ```sql
    -- No database changes required for Home Page Revamp
    ```

## Verification Plan

### Automated Tests
- None (Visual change).

### Manual Verification
1.  **Open Browser**: Navigate to `/` (Home).
2.  **Verify Content**: Check that all text sections above are present and correct.
3.  **Verify Layout**: Ensure the page is responsive and visually appealing.
4.  **Verify Links**: Click on the Association links (if implemented as placeholders, check hrefs).
5.  **No Redirect**: Confirm the page does not auto-redirect.
