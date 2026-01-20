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
