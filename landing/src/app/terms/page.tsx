"use client";

import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-heading)]" style={{ background: "#F8F6F2" }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#F8F6F2]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-5" style={{ height: '70px' }}>
          <Link href="/">
            <Image src="/images/logo.svg" alt="Parqlet" width={341} height={85} className="h-24 w-auto" priority />
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-normal text-[#504F4D] hover:text-[#222] transition-colors">
            <Image src="/images/ic_arrow-right.svg" alt="" width={16} height={16} />
            Back to home
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="mx-auto max-w-[760px] px-5 pt-16 pb-6 text-center">
        <h1 className="mb-[12px] text-[40px] font-normal leading-[1.1] text-[#222]">
          Terms of Service
        </h1>
        <p className="mb-[8px] text-base font-normal text-[#504F4D]">
          Updated May 10, 2026
        </p>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-[760px] px-5 pb-20">
        <Section n="1" title="DEFINITIONS">
          <P>The following capitalized terms have the meanings assigned below:</P>
          <P><B>&ldquo;Platform&rdquo;</B> means Parqlet&rsquo;s proprietary SaaS system, including all mobile apps (iOS and Android), web apps, APIs, dashboards, databases, and related technology operated by Parqlet, LLC.</P>
          <P><B>&ldquo;Company&rdquo;</B> means Parqlet, LLC, a limited liability company organized under the laws of the State of Texas (File No. 806567338), and its successors and assigns.</P>
          <P><B>&ldquo;Property Operator&rdquo;</B> means the HOA, building management company, or condominium association that has entered into a Master Service Agreement with the Company for access to the Platform for a specific Building.</P>
          <P><B>&ldquo;Member or Resident&rdquo;</B> means a verified resident of a Building authorized by the Property Operator who has created a Platform account per Section 3.</P>
          <P><B>&ldquo;Guest&rdquo;</B> means a non-resident individual whose vehicle is registered to an active Booking by a Member. Guests do not hold accounts and are not parties to these Terms; their conduct during a Booking is solely the Member&rsquo;s responsibility.</P>
          <P><B>&ldquo;Booking&rdquo;</B> means a confirmed, time-limited reservation of a specific parking spot within a Building, created by a Member for use by a Guest vehicle.</P>
          <P><B>&ldquo;Spot Owner&rdquo;</B> means the Member who has listed their assigned parking spot as available for Guest use.</P>
          <P><B>&ldquo;Credits&rdquo;</B> means the non-monetary, platform-specific units earned and spent through the Platform&rsquo;s credit economy, described in Section 9.</P>
          <P><B>&ldquo;Guest Liability Consent&rdquo;</B> means the in-app acknowledgment completed before each Booking confirming the Member&rsquo;s acceptance of responsibility for Guest conduct and Building rule compliance.</P>
          <P><B>&ldquo;LPR&rdquo;</B> means License Plate Recognition camera technology that matches vehicle plates against active Bookings or registered resident vehicles.</P>
          <P><B>&ldquo;User Content&rdquo;</B> means any information, reports, text, images, or other content submitted by a Member through the Platform, including issue reports, spot descriptions, and Neighbor Broadcast messages.</P>
          <P><B>&ldquo;Services&rdquo;</B> means all features and capabilities available through the Platform.</P>
          <P><B>&ldquo;Terms&rdquo;</B> means these Terms of Service as amended from time to time.</P>
        </Section>

        <Section n="2" title="NATURE OF SERVICE">
          <P>The Company provides a SaaS technology platform enabling Members to coordinate guest parking within their Building. The Platform facilitates permit issuance, booking management, spot-sharing coordination, credit accounting, and audit logging. It does not provide physical parking services of any kind.</P>
          <P>The Company expressly does not: own, lease, operate, manage, or control any physical parking facility or space; guarantee the availability, condition, safety, or suitability of any parking space; employ parking attendants, security personnel, enforcement officers, or tow operators; authorize, direct, or instruct towing decisions (all enforcement authority rests exclusively with the Property Operator); act as agent, bailee, custodian, or operator of any vehicle; provide valet or storage services; negotiate or mediate disputes between Members, Guests, or Property Operators; or guarantee that push notifications will be received, read, or acted upon.</P>
          <P>The Company is a neutral technology intermediary. All parking arrangements are made between Members and governed by the Property Operator&rsquo;s rules. The Company is not a party to any parking arrangement between Members or between a Member and a Guest.</P>
        </Section>

        <Section n="3" title="ELIGIBILITY AND ACCOUNT REGISTRATION">
          <P>To use the Platform you must: (a) be at least 18 years of age; (b) be a verified resident of a Building with an active Company agreement; (c) have an email address in the Property Operator&rsquo;s resident database; and (d) have legal capacity to enter a binding contract. Account creation requires a Property Operator invitation via email link or QR code. Your email is verified against the Building&rsquo;s resident list; if not found, registration is denied. You agree to provide accurate information and update it promptly when it changes.</P>

          <H3>3.1 Electronic Communications — Push Notifications</H3>
          <P>By creating an account, you consent to receive automated push notifications from the Company related to Bookings, Credits, spot availability, occupied-spot alerts, Booking expiry, and account activity. Push notifications are delivered through your device&rsquo;s operating system notification service. You may opt out of non-essential push notifications through your device&rsquo;s notification settings at any time without affecting your ability to use the Platform.</P>

          <H3>3.2 SMS Communications — Separate Consent Required</H3>
          <P>Text message (SMS) communications from the Company are subject to the Telephone Consumer Protection Act (TCPA). If you provide a mobile phone number and wish to receive SMS alerts, you will be presented with a separate, standalone opt-in consent at the time of phone number entry. That opt-in consent — not these Terms — constitutes your express written consent under the TCPA for the Company to send automated text messages to your mobile number. Message and data rates may apply. Frequency varies based on your Booking activity. To opt out of SMS at any time, reply STOP to any Company text message. These Terms govern your overall use of the Platform; your SMS consent is governed by the standalone consent form presented at enrollment.</P>

          <H3>3.3 Account Security and One Account Per Building</H3>
          <P>You are responsible for maintaining credential confidentiality and all account activity. Notify hello@parqlet.com immediately of any suspected unauthorized access. If you change or deactivate your mobile phone number, you agree to promptly update your account information to ensure that SMS messages are not sent to the person who acquires your old number. Each Member may maintain one active account per Building. Members with verified residency in multiple Buildings may hold one account per Building upon separate Property Operator verification. Creating multiple accounts within the same Building is prohibited and grounds for termination of all associated accounts.</P>
        </Section>

        <Section n="4" title="MEMBER RESPONSIBILITIES">
          <P>You are fully and solely responsible for: (a) your Guest&rsquo;s conduct throughout the entire Booking duration, including entry, use, and departure; (b) your Guest&rsquo;s compliance with all Building rules, parking policies, and applicable law; (c) any damage to property, vehicles, structures, or persons caused by your Guest or Guest&rsquo;s vehicle; (d) any towing fees, fines, citations, or penalties arising from your Guest&rsquo;s actions; (e) communicating all parking rules, spot location, access procedures, and Booking conditions to your Guest before the Booking window opens; and (f) ensuring your Guest vacates the designated spot at or before Booking expiration.</P>
          <P>You are responsible for the accuracy of all Booking data, including the Guest&rsquo;s license plate. An incorrect plate may result in an invalid permit and enforcement consequences for which the Company bears no liability. By listing your spot, you represent that: (a) you have the right to make it available; (b) the spot will be physically vacated and accessible; and (c) listing does not violate any Building rule, lease, or ownership agreement. If your listing right is disputed, the Company may suspend the spot listing pending resolution. Where a conflict exists between a Platform permit and a Building rule, the Building rule governs, provided nothing in these Terms requires you to comply with a Building rule that violates applicable law.</P>
        </Section>

        <Section n="5" title="MEMBER FINANCIAL LIABILITY FOR GUEST DAMAGE">
          <P>This Section sets forth the binding financial obligations of every Member who creates a Booking. By completing a Booking, you enter into a legally binding commitment to be personally and fully financially responsible for your Guest&rsquo;s actions. This Section is a material term of these Terms of Service and is enforceable by the Company, the Property Operator, and any third party harmed by your Guest&rsquo;s conduct.</P>

          <H3>5.1 Full Financial Responsibility</H3>
          <P>You are personally and financially liable for one hundred percent (100%) of all costs, damages, losses, fees, fines, and expenses of any kind arising directly or indirectly from your Guest&rsquo;s presence in the parking facility during the Booking window or any overstay thereafter, including but not limited to:</P>
          <UL items={[
            "Physical damage to any vehicle — including the Guest's vehicle, the Spot Owner's vehicle, and any other vehicle in the parking facility;",
            "Physical damage to any structure, fixture, or property within or adjacent to the parking facility, including gates, barriers, pillars, walls, landscaping, cameras, signage, and electrical systems;",
            "Damage caused during the Guest's arrival, parking maneuver, duration of stay, or departure from the facility;",
            "Towing fees, storage fees, and any damage incurred during towing of any vehicle resulting from your Guest's actions or overstay;",
            "Traffic citations, parking fines, or penalties issued in connection with your Guest's parking;",
            "Building violation fees or fines assessed by the Property Operator or any governing body in connection with your Guest's conduct;",
            "Emergency response costs, cleaning costs, or repair costs required as a result of your Guest's conduct;",
            "Any legal fees, court costs, or settlement amounts arising from claims brought by any third party in connection with your Guest's conduct.",
          ]} />

          <H3>5.2 Binding Financial Obligation</H3>
          <P>Your financial responsibility under this Section is absolute and is not limited by: (a) whether you were present during the Booking; (b) whether you communicated parking rules to your Guest; (c) whether the damage was intentional or accidental; (d) whether your Guest had valid insurance; or (e) any dispute between you and your Guest. The Company and the Property Operator may each pursue recovery of costs directly from you without first seeking recovery from your Guest.</P>

          <H3>5.3 Direct Reimbursement Obligation</H3>
          <P>If the Property Operator, the Company, any Spot Owner, or any third party incurs costs as a result of your Guest&rsquo;s conduct during a Booking you initiated, you agree to reimburse those costs in full upon written demand. You authorize the Company to share your account information, Booking records, Guest Liability Consent logs, and any relevant Platform data with the Property Operator or any third party pursuing a legitimate claim for reimbursement arising from your Booking.</P>

          <H3>5.4 Insurance Recommendation</H3>
          <P>The Company strongly recommends that all Members maintain active renters&rsquo; insurance or homeowners&rsquo; insurance that includes personal liability coverage sufficient to cover potential Guest-related damage claims. The existence or absence of such insurance does not affect or limit your financial obligations under this Section.</P>

          <H3>5.5 Relationship to Property Operator</H3>
          <P>This Section is included for the express benefit of Property Operators, who rely on Member financial accountability as a condition of permitting the Platform to operate within their Building. Property Operators are expressly intended third-party beneficiaries of this Section 5 only, and may enforce the obligations in this Section directly against any Member whose Guest causes damage within the Building.</P>
        </Section>

        <Section n="6" title="GUEST LIABILITY CONSENT FLOW">
          <P>Before confirming each Booking, you must complete the Guest Liability Consent flow within the Platform, reviewing your responsibilities and tapping a confirmation button. Bookings cannot be confirmed without this step. Completion constitutes a binding, timestamped acknowledgment that you accept the responsibilities in Section 4 for the specific Booking. This record is retained by the Company and may be shared with the Property Operator for audit or enforcement purposes.</P>
        </Section>

        <Section n="7" title="BOOKINGS AND PERMITS">
          <P>A Booking is not confirmed or valid until the Member receives both: (a) an in-app confirmation screen indicating the Booking was successfully created; and (b) a confirmation notification to the email address associated with the account. It is the Member&rsquo;s sole responsibility to verify that both confirmations are received before the Guest parks. Parking without a confirmed Booking — even if payment was initiated — is not authorized and may result in enforcement action for which the Company bears no responsibility.</P>

          <H3>Guest Notice and Limitation of Claims</H3>
          <P>Guests are not parties to these Terms of Service and have no direct contractual relationship with Parqlet. By initiating a Booking for a Guest, the Member represents that they have informed their Guest that: (a) parking at the facility is coordinated through third-party software operated by Parqlet, LLC; (b) Parqlet is a software platform only and is not responsible for the physical condition of the parking facility, enforcement decisions, vehicle damage, or any other physical event at the property; (c) use of the parking space is at the Guest&rsquo;s sole risk; and (d) any claim arising from the Guest&rsquo;s use of the parking facility must be directed against the Member and/or the Property Operator, not against Parqlet. To the extent any Guest brings a claim against Parqlet arising from a Booking, such claim is expressly limited to the amount paid by the Member for that specific Booking. The Member agrees to indemnify Parqlet for any claim brought by their Guest that exceeds this amount.</P>

          <P>A confirmed Booking is a time-limited, non-exclusive license for the identified Guest vehicle to occupy the designated spot during the Booking window. It creates no property right, easement, or possessory interest in any parking space. Permits are valid only for the specific license plate, spot, Building, and time window stated at Booking — they are non-transferable, non-assignable, and expire automatically at the end of the Booking window. The Company does not enforce parking rules, tow vehicles, issue citations, or instruct enforcement vendors. All enforcement decisions are made exclusively by the Property Operator. A Guest remaining after Booking expiration violates Building rules; the Company&rsquo;s sole action is to send automated notifications per Section 8 and bears no liability for overstay consequences. Resale, transfer, or commercial redistribution of any Platform-issued permit is prohibited and grounds for immediate account termination.</P>
        </Section>

        <Section n="8" title="OCCUPIED SPOT PROTOCOL AND NOTIFICATION LIMITATIONS">
          <P>If a Guest finds the designated spot occupied during an active Booking, the Member may report the issue via the in-app Report Issue function, which sends a push notification to the Spot Owner. All Platform notifications are informational only. The Company does not guarantee any notification will be received, read, or acted upon and is not liable for any loss arising from a Spot Owner&rsquo;s failure to respond or vacate.</P>
          <P>If the spot remains occupied fifteen (15) minutes after an issue report, the Platform will attempt to locate an alternative available spot at no additional Credit cost. If an alternative is found, a new Booking is confirmed. If none is available, Credits are refunded; All Booking refunds under this Policy are issued as Credits to your Parqlet account balance. If you purchased Credits using Apple Pay, Google Pay, or a card, that purchase is not reversed or refunded to your original payment method — Credits are the only refund currency. A Credit refund is the Member&rsquo;s sole remedy for an occupied spot; the Company has no further liability. At Booking expiration, the Platform sends automated notifications to the Member and Spot Owner. The Spot Owner may send one (1) follow-up reminder requesting Guest vacating. These notifications are informational only.</P>
        </Section>

        <Section n="9" title="PAYMENTS AND FEES">
          <P>All monetary payments are processed by Stripe, Inc. By completing a payment you also agree to Stripe&rsquo;s Terms of Service and Privacy Policy at stripe.com. The Company does not store raw payment card data; only tokenized payment information is retained. All fees for confirmed Bookings are non-refundable except as provided in Section 8 or if the confirmed booking starts in more than in 24h or as required by applicable law. Initiating a chargeback for a completed Booking not disputed prior to use constitutes a breach of these Terms and may result in account suspension and recovery of associated fees. The Company is not responsible for errors, outages, or failures attributable to Stripe or any other payment processor.</P>

          <H3>9.1 Overstay and Unauthorized Parking</H3>
          <P>Parqlet does not charge penalty fees to Members or Guests. If a Guest overstays the confirmed Booking window, the Member who made the Booking will be notified so they can ask their Guest to move the vehicle promptly. If the vehicle remains in the spot after notification, Building management may tow it at the Member&rsquo;s expense, in accordance with the Building&rsquo;s own parking rules. Unauthorized parking in a spot other than the one designated in the Booking, or any other material violation of these Terms or Building parking rules, may result in Building management taking action independent of the Company, including towing.</P>
        </Section>

        <Section n="10" title="CREDIT ECONOMY">
          <P>Members earn one (1) Credit when their listed spot is used for a confirmed Booking and spend one (1) Credit when making a Booking. Credits are a limited, non-monetary, platform-specific unit of account. They are not currency, not a financial instrument, have no cash value, and are not currently redeemable for cash, gift cards, or any third-party product. Credits may only be used within the Platform for eligible Bookings. Credits are tied to the specific Building in which they are earned and cannot be transferred to another Building or between accounts.</P>
          <P>If a Property Operator terminates its agreement with the Company, Members will be notified at least thirty (30) days before the termination effective date so they can plan accordingly and avoid scheduling Bookings beyond that date. All Credits associated with a Member&rsquo;s account expire on the termination effective date, including Credits purchased using Apple Pay, Google Pay, or a card. No refund is issued for expired Credits, in Credits or otherwise.</P>
          <P>The Company reserves the right to modify Credit earning rates, spending rates, or eligible uses, or to suspend the Credit system upon thirty (30) days&rsquo; notice. Credits may be forfeited upon account termination for cause. The Company may in the future introduce Credit redemption features including a marketplace or rewards exchange, subject to additional terms disclosed at launch.</P>
          <P>Members are solely responsible for determining and satisfying any tax obligations arising from Credits earned or redeemed through the Platform, including any determination of whether Credits constitute taxable barter income under applicable federal, state, or local tax law. Credits have no fixed or determinable dollar value, are not exchangeable for cash, and are not issued in a manner that constitutes a barter exchange as defined under IRC § 6045. Parqlet takes no position on whether Credits constitute taxable income, does not issue tax forms (including Form 1099-B) in connection with Credits, and makes no representation regarding the tax treatment of Credits. Members should consult a qualified tax advisor regarding their individual circumstances.</P>
        </Section>

        <Section n="11" title="USER CONTENT">
          <P>The Platform allows Members to submit User Content including issue reports, spot availability descriptions, and Neighbor Broadcast messages. By submitting User Content, you grant the Company a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and process your User Content solely as necessary to operate and provide the Platform. You represent that you have all rights necessary to grant this license and that your User Content does not violate any third-party rights or applicable law.</P>
          <P>The Company reserves the right to remove any User Content at its discretion without notice if it violates these Terms, any Building rule, or any applicable law. The Company is not liable for User Content submitted by Members and, to the extent permitted by applicable law, is not responsible for monitoring or filtering User Content. Nothing in this Section creates any obligation on the Company to store, maintain, or publish any User Content.</P>
        </Section>

        <Section n="12" title="PROHIBITED CONDUCT">
          <P>You agree not to: use the Platform for any unlawful purpose; impersonate any person or falsely represent your residency; create multiple accounts within the same Building; circumvent or reverse-engineer any Platform security or verification system; interfere with Platform operations, servers, or networks; harvest or scrape Platform data without written consent; resell or commercially exploit any Platform permit or feature; upload malware or harmful code; use the Platform in a manner that discriminates on the basis of race, color, ethnicity, national origin, religion, sex, gender identity, sexual orientation, familial status, disability, or any other protected characteristic — including selectively responding to or declining Neighbor Broadcast requests based on any such characteristic; provide false Guest vehicle information; or use the Platform in connection with any unregistered, uninsured, or inoperable vehicle.</P>

          <H3>Fair Housing Reporting</H3>
          <P>If you believe that another Member has declined to respond to your Neighbor Broadcast request, refused to share their parking spot, or engaged in any other conduct on the Platform based on your race, color, ethnicity, national origin, religion, sex, gender identity, sexual orientation, familial status, disability, or any other protected characteristic, you may report the concern to Parqlet at hello@parqlet.com with the subject line &lsquo;Fair Housing Concern.&rsquo; Parqlet will review all good-faith reports and may take appropriate action, including account review or suspension of the reported Member. Parqlet maintains a log of Fair Housing reports received and actions taken. Nothing in this Section creates an obligation on Parqlet to investigate, adjudicate, or resolve Fair Housing disputes, which remain subject to applicable federal and state law enforcement through the U.S. Department of Housing and Urban Development (HUD) and applicable state agencies.</P>
        </Section>

        <Section n="13" title="NO GUARANTEE OF PARKING">
          <P>The Company does not guarantee that a parking spot will be available, vacant, accessible, safe, or suitable at any time. Spot availability depends on factors outside the Company&rsquo;s control, including Spot Owner windows, concurrent Bookings, Building conditions, construction, emergencies, and Property Operator decisions.</P>
        </Section>

        <Section n="14" title="ASSUMPTION OF RISK">
          <P>By using the Platform, you acknowledge and voluntarily assume all risks associated with: shared parking in a residential community including risk of vehicle damage, theft, vandalism, or loss; Guest behavior and Building rule compliance; physical conditions of the parking facility including lighting, surface conditions, and ingress/egress hazards; actions or inactions of other residents, guests, or third parties in the parking facility; and system outages, technical errors, or notification failures. This assumption applies regardless of whether the risk was foreseeable at the time of Booking.</P>
          <P>For the avoidance of doubt, the assumption of risk in this Section applies regardless of the cause of loss or damage, including damage caused to a Guest&rsquo;s vehicle by third parties, unknown actors, or other vehicles in the parking facility. Parqlet makes no representation regarding the physical security of any parking facility. Members assume all risk of damage to Guest vehicles regardless of whether the damage was caused by the Guest, by another resident, by a third party, or by an unknown cause. Parqlet is not responsible for, and has no obligation to investigate or remediate, any damage to vehicles parked through the Platform.</P>
        </Section>

        <Section n="15" title="DATA, AUDIT LOGS, AND LICENSE PLATE INFORMATION">
          <P>By using the Platform you consent to data collection, storage, and processing as described in the Privacy Policy, incorporated herein by reference and available at parqlet.com/privacy. Booking activity, Guest vehicle license plates, timestamps, unit numbers, and Guest Liability Consent records may be shared with the applicable Property Operator for security, enforcement, and compliance purposes only. License plate data is used solely for permit validation, enforcement support, and Building security. The Company does not sell, share for advertising, or use license plate data for any purpose unrelated to Platform operation. License plate data is retained for ninety (90) days following Booking expiration and then deleted or anonymized. In Buildings with active LPR integration, the Platform may receive real-time plate reads from building cameras. LPR hardware and enforcement decisions are operated by the Property Operator or its camera vendor; the Company acts only as a data-matching layer and is not responsible for LPR accuracy or enforcement decisions.</P>
        </Section>

        <Section n="16" title="TERMINATION">
          <P>The Company may suspend or terminate your account at any time, with or without prior notice, for: violation of these Terms; fraudulent or unauthorized activity; conduct posing a risk to users, the Platform, or third parties; determination by the Property Operator that you are no longer a verified resident; legal or regulatory requirements; or inactivity for more than twelve (12) consecutive months. Upon termination, Platform access ceases immediately, all Credits are forfeited, and active Bookings are cancelled without refund if termination is for cause.</P>
          <P>Members who believe their account was terminated in error may submit a written appeal to hello@parqlet.com within thirty (30) days of the termination notice. The Company will review the appeal and respond within fifteen (15) business days. Reinstatement is at the Company&rsquo;s sole discretion. You may request voluntary account deletion by contacting hello@parqlet.com, which results in Credit forfeiture and data deletion per the Privacy Policy, subject to legally required retention periods.</P>
        </Section>

        <Section n="17" title="INTELLECTUAL PROPERTY">
          <P>The Platform, including all software, algorithms, design, content, trademarks, and trade secrets, is the exclusive property of the Company or its licensors. These Terms grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for its intended purpose only. You may not copy, modify, distribute, sell, sublicense, reverse-engineer, or create derivative works from any part of the Platform.</P>
        </Section>

        <Section n="18" title="ACCESSIBILITY">
          <P>The Company is committed to making the Platform accessible to all users. We work toward compliance with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. If you experience accessibility barriers when using the Platform, please contact us at hello@parqlet.com so we may work to address them. This commitment does not waive any other provision of these Terms.</P>
        </Section>

        <Section n="19" title="DISCLAIMER OF WARRANTIES">
          <P upper>THE PLATFORM AND ALL SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTY OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, THE COMPANY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, UNINTERRUPTED OR ERROR-FREE OPERATION, ACCURACY OR RELIABILITY OF DATA OR CONTENT, DELIVERY OR EFFECTIVENESS OF NOTIFICATIONS, AND THE PHYSICAL SAFETY OR CONDITION OF ANY PARKING FACILITY.</P>
        </Section>

        <Section n="20" title="LIMITATION OF LIABILITY AND INDEMNIFICATION">
          <H3>20.1 Exclusion of Certain Damages</H3>
          <P upper>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY AND ITS OFFICERS, DIRECTORS, MEMBERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING: LOSS OF DATA, REVENUE, BUSINESS, OR GOODWILL; VEHICLE DAMAGE, THEFT, VANDALISM, OR LOSS; TOWING FEES, CITATIONS, OR ENFORCEMENT PENALTIES; PERSONAL INJURY OR PROPERTY DAMAGE; DAMAGES FROM DISPUTES BETWEEN MEMBERS, GUESTS, OR PROPERTY OPERATORS; OR DAMAGES FROM NOTIFICATION FAILURES, SYSTEM OUTAGES, OR THIRD-PARTY SERVICE INTERRUPTIONS.</P>

          <H3>20.2 Liability Cap</H3>
          <P upper>THE COMPANY&rsquo;S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) ONE HUNDRED U.S. DOLLARS ($100.00); OR (B) THE TOTAL FEES PAID BY YOU IN THE THIRTY (30) DAYS IMMEDIATELY PRECEDING THE CLAIM. TO THE EXTENT ANY APPLICABLE LAW PROHIBITS LIMITING LIABILITY BELOW A MINIMUM THRESHOLD, THE COMPANY&rsquo;S LIABILITY SHALL NOT EXCEED THAT MINIMUM AMOUNT.</P>
          <P>You acknowledge these limitations reflect a reasonable, negotiated allocation of risk and are a material condition of Platform access. The Company would not provide the Platform without these limitations. Notwithstanding Section 22, any mandatory consumer protection laws of your state of residence that cannot be waived by private contract shall apply to you.</P>

          <H3>20.3 Exceptions</H3>
          <P>Nothing in this Section limits the Company&rsquo;s liability for its own gross negligence or willful misconduct, or liability that cannot be excluded under applicable law.</P>

          <H3>20.4 Indemnification</H3>
          <P>You agree to defend, indemnify, and hold harmless Parqlet, LLC and its officers, directors, members, employees, agents, successors, and assigns from and against all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to: (a) your use of the Platform; (b) your Guest&rsquo;s conduct in connection with any Booking; (c) your violation of these Terms or any applicable law; (d) any inaccuracy in information you provide; (e) any claim brought by your Guest against the Company relating to a Booking you initiated; or (f) any User Content you submit through the Platform.</P>
        </Section>

        <Section n="21" title="DISPUTE RESOLUTION — MANDATORY ARBITRATION">
          <P>Before initiating formal proceedings, contact the Company at hello@parqlet.com with a written description of the dispute and relief sought. The parties will attempt good-faith resolution within thirty (30) days. If unresolved, either party may initiate arbitration.</P>
          <P>Except for claims eligible for small claims court and claims for emergency injunctive or equitable relief to protect intellectual property rights or Confidential Information (which may be brought in any court of competent jurisdiction), all disputes arising out of or relating to these Terms or the Platform shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration may be conducted by telephone, video conference, or written submission. The seat of arbitration shall be Austin, Texas. The AAA caps your initial filing fee at $200. If the arbitrator determines your claim was filed in good faith, Parqlet, LLC will pay all AAA filing, case management, and arbitrator fees beyond your initial $200. If a claim is filed in bad faith, the filing party may be required to pay all fees.</P>
          <P>ARBITRATION OPT-OUT: You may opt out of this arbitration agreement within thirty (30) days of first accepting these Terms by sending an email to hello@parqlet.com with your full name and a statement that you decline the agreement to arbitrate. If you opt out, all other provisions of these Terms remain in full force and effect. Opting out does not affect any previously agreed-to arbitration provision. If you do not opt out within this thirty (30) day window, your acceptance of this arbitration agreement is final.</P>
          <P upper>CLASS ACTION WAIVER: YOU AND THE COMPANY EACH WAIVE THE RIGHT TO PARTICIPATE IN ANY CLASS ACTION, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR MAY NOT CONSOLIDATE CLAIMS OF MORE THAN ONE PERSON. IF THIS WAIVER IS FOUND UNENFORCEABLE IN A JURISDICTION THAT PROHIBITS SUCH WAIVERS, DISPUTES IN THAT JURISDICTION SHALL BE RESOLVED BY LITIGATION IN THE COURTS SPECIFIED IN SECTION 21, NOT BY ARBITRATION. IN ALL OTHER JURISDICTIONS, THIS ARBITRATION PROVISION REMAINS IN FULL FORCE. BY AGREEING TO THESE TERMS, BOTH PARTIES WAIVE THE RIGHT TO A JURY TRIAL FOR ANY DISPUTE SUBJECT TO ARBITRATION. This Section survives termination of these Terms.</P>
        </Section>

        <Section n="22" title="YOUR DATA RIGHTS AND PRIVACY PROTECTIONS">
          <H3>22.1 Our Commitment to Your Privacy</H3>
          <P>The Company is committed to protecting your personal information. Your use of the Platform is also governed by our Privacy Policy, available at parqlet.com/privacy, which is incorporated into these Terms by reference. In the event of any conflict between these Terms and the Privacy Policy regarding the treatment of your personal information, the Privacy Policy governs.</P>

          <H3>22.2 Data Security</H3>
          <P>The Company implements industry-standard technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction, including encryption of data in transit and at rest, role-based access controls, and regular security assessments. While we take these measures seriously, no system is completely secure, and we cannot guarantee absolute security of your information.</P>

          <H3>22.3 Data Breach Notification</H3>
          <P>In the event of a data breach that is reasonably likely to result in harm to you, the Company will notify you as required by applicable law — generally within seventy-two (72) hours of becoming aware of the breach for regulatory notifications, and as soon as reasonably practicable for individual notifications. Notification will be provided via the email address associated with your account.</P>

          <H3>22.4 Your Privacy Rights</H3>
          <P>Depending on your state of residence, you may have the right to access, correct, delete, or obtain a copy of your personal information held by the Company. You may also have the right to opt out of the sale or sharing of your personal information. The Company does not sell your personal information. To exercise any privacy rights, contact us at hello@parqlet.com. We will respond to verified requests within forty-five (45) days. Full details of your privacy rights are set forth in the Privacy Policy.</P>

          <H3>22.5 Minimal Data Collection</H3>
          <P>The Company collects only the personal information reasonably necessary to provide the Services. We do not collect personal information for purposes incompatible with providing and improving the Platform. We do not use your personal information for targeted advertising or sell it to third parties for commercial purposes.</P>

          <H3>22.6 Children&rsquo;s Privacy</H3>
          <P>The Platform is not intended for use by persons under the age of 18. The Company does not knowingly collect personal information from minors. If you believe a minor has provided personal information through the Platform, contact us at hello@parqlet.com and we will promptly delete such information.</P>

          <H3>22.7 Data Retention and Deletion</H3>
          <P>The Company retains your personal information only for as long as necessary to provide the Services, comply with legal obligations, and resolve disputes. Upon account deletion, your personal information will be deleted or anonymized in accordance with the retention schedules set forth in the Privacy Policy. Certain data may be retained longer where required by applicable law or legitimate business necessity.</P>
        </Section>

        <Section n="23" title="GOVERNING LAW">
          <P>These Terms are governed by the laws of the State of Delaware, without regard to its conflict-of-law provisions. To the extent any claim is not subject to arbitration, the parties consent to exclusive jurisdiction in the state or federal courts of New Castle County, Delaware. To the extent of any conflict between this governing law provision and the mandatory consumer protection laws of your state of residence, the mandatory consumer protection laws of your state shall prevail solely with respect to the subject matter of such mandatory laws, and Delaware law shall govern all other matters.</P>
        </Section>

        <Section n="24" title="GENERAL PROVISIONS" last>
          <P><B>Amendments:</B> The Company may modify these Terms at any time. For material changes, notice will be provided via email or through the Platform at least thirty (30) days before the effective date. Continued use after that date constitutes acceptance.</P>
          <P><B>Severability:</B> If any provision is found invalid or unenforceable, the remaining provisions continue in full force. <B>Waiver:</B> Failure to enforce any provision does not constitute a waiver. <B>Assignment:</B> You may not assign these Terms without the Company&rsquo;s prior written consent. The Company may assign freely upon notice.</P>
          <P><B>Force Majeure:</B> The Company is not liable for delays or failures resulting from causes beyond its reasonable control, including natural disasters, pandemics, power outages, internet failures, labor disputes, supply chain disruptions, acts or omissions of third-party building management platforms, or third-party service outages including Stripe, cloud providers, or LPR vendors.</P>
          <P><B>Entire Agreement:</B> These Terms, together with the Privacy Policy and any Building-specific policies provided by the Property Operator, constitute the entire agreement between you and the Company. <B>Contact:</B> hello@parqlet.com &nbsp;|&nbsp; www.parqlet.com</P>
        </Section>
      </div>

      {/* ── Footer ── */}
      <footer className="mx-auto mb-6 flex max-w-[1160px] items-center justify-between px-5">
        <span className="text-xs font-normal uppercase tracking-wider text-[#A7A7A7]">
          <a href="mailto:hello@parqlet.com" className="text-inherit no-underline">hello@parqlet.com</a>
        </span>
        <span className="text-xs font-normal uppercase tracking-wider text-[#A7A7A7]">
          All rights reserved
        </span>
      </footer>
    </div>
  );
}

// ─── Content primitives ──────────────────────────────────────────────────

function Section({
  n,
  title,
  last = false,
  children,
}: {
  n: string;
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="py-8"
      style={{ borderBottom: last ? "none" : "1px solid #E7E4E0" }}
    >
      <h2 className="mb-4 text-[20px] font-normal leading-[1.3] text-[#222]">
        {n}. {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-2 text-[16px] font-medium leading-[1.4] text-[#222]">
      {children}
    </h3>
  );
}

function P({ children, upper = false }: { children: React.ReactNode; upper?: boolean }) {
  return (
    <p
      className={`text-[15px] leading-relaxed text-[#504F4D] ${upper ? "font-medium" : ""}`}
    >
      {children}
    </p>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-[#222]">{children}</strong>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 pl-5" style={{ listStyleType: "disc" }}>
      {items.map((item, i) => (
        <li key={i} className="text-[15px] leading-relaxed text-[#504F4D]">
          {item}
        </li>
      ))}
    </ul>
  );
}
