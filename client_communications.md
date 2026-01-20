# Client Communications Log

## 2026-01-19 - Hosting & Domain Discussion

**Context:**
Client (Dave) asked about hosting. IT contact (Dennis) suggested moving to a Windows VPS or using existing Linux server. I (Josh) clarified the stack (Azure Static Web App + Azure SQL) and recommended staying on Azure for cost/maintenance reasons. Dennis agreed.

### Email from Dennis to Josh (and Dave)
> Hi Josh,
> 
> Lets leave it in place as you have it. I personally haven't used Azure much (I favour AWS) but thats just my preference. I can do the CNAME record change when required.
> 
> Do we need to do email addresses @alsm.au at any stage ?
> 
> Just a slight cosmetic suggestion - look at using the HTML5 "autofocus" element on the top data entry field of the login etc. so that one doesn't have to click on the first field to start entering information/login etc.
> 
> Dave I have backordered alsm.com.au for 2 years you should have a crazy domains order receipt for this,
> 
> Dennis

### Reply Sent
> Hi Dennis
>
> Thanks for the update, that sounds like a plan.
>
> Hosting: We'll stick with the existing Azure setup.I'll let you know the specific CNAME records when we are ready to point to the domain.
>
> UI: Good call on the autofocus. I've just updated the Login and Register pages to include that.
>
> Emails: Regarding your question about @alsm.au (or .com.au): Currently, the system sends registration confirmations (and soon order confirmations) via Resend. These emails are currently coming from my own domain. To have them come from noreply@alsm.com.au (or .au), we will need to add a few DNS records (DKIM/SPF) to verify ownership. Once you have the domain management accessible, let me know, and I can generate those records for you to add.
>
> Regards
> Joshua Boothman
>
> (03) 6363 2095

## 2026-01-20 - System Updates & Next Steps

**Context:**
Summary of work completed over Jan 19-20 sent to Dave & Gemma, including notes on upcoming priorities.

### Email Sent
> Hi Dave & Gemma
>
> Just a heads up, I won't be around tomorrow, and some of Thursday, but there is lots of new stuff for you to look at on the site...
>
> **Public Air Show Registration:**
> *   Enabled public registration for the Air Show. Email will be sent to people that register with a code to show at the gate
> *   Added a new "Air Show Attendees" report to the Admin Dashboard to track these registrations.
> *   Updated the event details page to display public event days.
>
> **FAQ System:**
> *   Added a new "FAQ" section to the public website.
> *   Created an Admin tool to easily add, edit, sort, and upload images for FAQs.
>
> **Camping Fees & Booking:**
> *   The system now correctly calculates and displays fees for extra adults.
> *   The booking screen now shows a transparent breakdown of costs so users see exactly what they are paying for.
>
> **Merchandise Ordering:**
> *   You can now drag and drop products in the Admin panel to change their order.
> *   This new order instantly updates on the public Store page.
>
> **Admin Dashboard:**
> *   Added a new "Air Show Attendees" card for quick stats.
> *   Improved the "Camping" card layout and fixed display issues.
>
> **Reports:**
> *   Added a "Camping Availability Report" to track booked vs. available sites.
> *   Users can now view available campsites in a "List View" in addition to the map.
>
> **Still to Do:**
> *   **Flight Line Duties:** Managing rosters, schedules, and pilot assignments for the flight line.
> *   **Square Integration:** Switching from testing mode to live credit card processing.
> *   **Subevent Variations:** Adding options for event tickets (e.g., "Steak Choice: Rare/Medium").
> *   **Legacy Booking Import:** Allowing manually reserved campsites for previous attendees to be linked when they register.
>
> Regards
> Joshua Boothman
>
> (03) 6363 2095
