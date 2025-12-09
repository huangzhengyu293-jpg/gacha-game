'use client';

import Link from 'next/link';

const CONTAINER_CLASS = 'flex mx-auto px-4 py-8 pb-48 max-w-4xl text-white';
const SECTION_CLASS =
  'bg-white/0 text-white/90 leading-relaxed text-sm [&_p]:mb-4 [&_p]:text-justify';
const LIST_CLASS = 'list-disc pl-6 space-y-3 text-justify';
const ORDERED_LIST_CLASS = 'list-decimal pl-6 space-y-3 text-justify';
const ALPHA_LIST_CLASS = 'list-[lower-alpha] pl-6 space-y-3 text-justify';

export default function TermsOfServicePage() {
  return (
    <div className={CONTAINER_CLASS}>
      <section className={SECTION_CLASS}>
        <article>
          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            INTRODUCTION
          </h2>
          <p>
            Flamedraw.com is operated by PD Operations B.V. (hereinafter
            “Flamedraw”, “Company”, “We” or “Us”), a company duly incorporated
            under the laws of Curaçao with company number 171219 and registered
            office at Korporaalweg 10.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            ACCEPTANCE
          </h2>
          <p>
            By registering an account at <span className="underline">www.Flamedraw.com</span> (the “Website”), you enter into
            an agreement with Flamedraw, and agree to be bound by these Terms of
            Service (the “Agreement”) and by the terms governing our products as
            referenced in this Agreement.
          </p>
          <p>
            Please read these Terms carefully to understand the rules and
            conditions that apply to accessing and using the Website or any of
            the services offered. If you have any doubts regarding your
            obligations under these Terms, please seek legal advice.
          </p>
          <p>
            If you disagree with these Terms, please refrain from accessing the
            Website, registering an account, or using any services offered on
            the Website.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            DEFINITIONS
          </h2>
          <ul className={LIST_CLASS}>
            <li>
              <span className="font-bold">Account or User Account:</span> refers
              to your user account created on Flamedraw.com.
            </li>
            <li>
              <span className="font-bold">Product:</span> refers to any service
              on the Website, including packs, deals, draws, or battles.
            </li>
            <li>
              <span className="font-bold">Restricted Territories:</span> refers
              to all jurisdictions banned from the Website, including
              Afghanistan, Belarus, Burma, Central African Republic, Cuba,
              Democratic Republic of Congo, Ethiopia, Haiti, Iran, Iraq, Lebanon,
              Libya, Myanmar, Nicaragua, North Korea, Russia, South Sudan,
              Sudan, Syria, Ukraine, United States of America, Venezuela, and
              Yemen.
            </li>
            <li>
              <span className="font-bold">Terms:</span> refers to this agreement
              made up of the Terms of Service, Privacy Policy, AML Policy, Bonus
              and Promotion Policy.
            </li>
            <li>
              <span className="font-bold">You, User or Customer:</span> refers
              to each natural individual that has an Account at{' '}
              <Link
                href="https://Flamedraw.com"
                className="text-blue-400 underline"
              >
                Flamedraw.com
              </Link>
              .
            </li>
          </ul>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            USER ACCOUNT
          </h2>
          <h3 className="text-sm font-bold mt-6 text-white">Registration</h3>
          <ul className={ORDERED_LIST_CLASS}>
            <li>
              To use any services on the Website, you must register an Account.
            </li>
            <li>
              Registration is completed by filling out and submitting the
              registration form available on the Website.
            </li>
            <li>
              You must enter all mandatory information requested, namely your
              name, date of birth, address, and email.
            </li>
            <li>
              If the requested information is not provided, complete, or
              accurate, we will not process your application and you will not be
              able to open an Account.
            </li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">Username</h3>
          <p>
            When registering, a username will be automatically assigned to you.
            You may change your username afterward as long as it is not
            offensive or targeted toward specific groups, Flamedraw, or its
            staff. Flamedraw reserves the right to reject registrations or
            username changes at its sole discretion and may change your username
            if needed.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Know Your Customer
          </h3>
          <ul className={LIST_CLASS}>
            <li>
              You represent and warrant that any information provided in your
              application form is true, updated, and correct.
            </li>
            <li>
              We may request any KYC documentation needed to determine your
              identity and location and may restrict services until the
              identification process is completed.
            </li>
            <li>
              If you realize information provided is incorrect, you must amend
              it immediately. Using third-party identities or aliases
              constitutes a breach of these Terms.
            </li>
            <li>
              We may request additional information at any time, including
              government-issued identification or tax identification documents.
              Failure to provide requested documentation may result in restricted
              access, retention of funds, or refusal of redemptions and
              exchanges.
            </li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">
            Multiple Accounts
          </h3>
          <p>
            You warrant that you do not have an existing Account on the Website.
            Registering multiple accounts may result in termination and
            forfeiture of rights, XP, or items on those accounts.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Security &amp; Responsibility
          </h3>
          <ul className={LIST_CLASS}>
            <li>
              You are solely responsible for safeguarding access to your Account
              and login credentials, including 2FA.
            </li>
            <li>
              Notify us immediately of any security breach or unauthorized use.
            </li>
            <li>
              We are not liable for any misuse of your Account due to disclosure
              of your login details.
            </li>
            <li>
              You are prohibited from borrowing, selling, transferring, or
              acquiring Accounts and are responsible for all activities under
              your Account.
            </li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">
            Acceptance Policy
          </h3>
          <p>
            We reserve the right to refuse any application for an Account at our
            sole discretion, including applications that do not meet the
            requirements mentioned in these Terms.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            PLAYER WARRANTIES
          </h2>
          <h3 className="text-sm font-bold mt-6 text-white">Capacity</h3>
          <ul className={LIST_CLASS}>
            <li>You are at least eighteen (18) years old or older as required in your jurisdiction.</li>
            <li>You possess the legal capacity to enter into these Terms.</li>
            <li>You engage with the Services voluntarily for your personal gratification.</li>
            <li>You use the Website at your sole option, discretion, and risk.</li>
            <li>You use the Website strictly in a personal and non-professional capacity.</li>
            <li>You purchase products on your own behalf.</li>
            <li>You will not use the Services while under the influence of substances that impair judgment.</li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">
            Personal Information
          </h3>
          <ul className={LIST_CLASS}>
            <li>
              All information you provide is true, complete, and correct, and you
              will immediately notify us of any changes.
            </li>
            <li>You will keep your information up to date at all times.</li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">Funds</h3>
          <ul className={LIST_CLASS}>
            <li>
              You will not credit your account with funds originating from
              criminal or unauthorized activity.
            </li>
            <li>You will not use payment methods that do not belong to you.</li>
            <li>
              You acknowledge that you cannot add balance if your account is
              suspended, blocked, or closed.
            </li>
            <li>You are not allowed to borrow or lend funds to another user.</li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">
            Account Activity
          </h3>
          <ul className={LIST_CLASS}>
            <li>
              Your Flamedraw account is not a bank account or investment product.
            </li>
            <li>
              You will not engage in fraudulent, collusive, or unlawful activity
              and will not use software-assisted methods to gain advantage.
            </li>
            <li>You will not operate syndicates or professional activities.</li>
            <li>
              We may suspend or close your account and cancel prizes if we
              suspect you breached these warranties.
            </li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">Tax</h3>
          <p>
            You are solely responsible for the accurate reporting and timely
            payment of any taxes required under applicable laws as a result of
            using the Services.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">Others</h3>
          <ul className={LIST_CLASS}>
            <li>
              You will comply with court orders and will not link to Flamedraw in
              ways that are illegal, unfair, or damaging to our reputation.
            </li>
            <li>You will not access other users’ accounts or impersonate them.</li>
            <li>You will not engage in platform manipulation, reverse engineering, or disruptive actions.</li>
            <li>
              You will not impose unreasonable load on our infrastructure or assist others in violating these Terms.
            </li>
          </ul>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            ACCOUNT SUSPENSION AND CLOSURE
          </h2>
          <p>We reserve the right to close or suspend your account if:</p>
          <ol className={ORDERED_LIST_CLASS}>
            <li>You use the Website in a fraudulent, collusive, illegal, or improper manner.</li>
            <li>You act unfairly, cheat, gain unfair advantage, or use the account for a third party.</li>
            <li>You breach these Terms, applicable regulations, or fair use.</li>
            <li>We suspect your account has been compromised.</li>
            <li>You breach the warranties in clause 5.</li>
          </ol>
          <p>
            If we close or suspend your account, you are liable for all claims,
            losses, liabilities, damages, costs, and expenses incurred by us. We
            may cancel or void prizes and may close your account at any time at
            our discretion. You may terminate your account by contacting{' '}
            <Link
              href="mailto:Support@Flamedraw.com"
              className="text-blue-400 underline"
            >
              Support@Flamedraw.com
            </Link>
            ; any unclaimed prizes will be forfeited upon closure.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            PURCHASE
          </h2>
          <h3 className="text-sm font-bold mt-6 text-white">
            Account Balance
          </h3>
          <p>
            To purchase packs or use Flamedraw products, add balance through
            payment methods available on the Website. Only payment methods owned
            by you may be used. Credits are generally processed immediately,
            though payment provider delays and bank fees are outside our control.
            We reserve the right to refuse attempts to credit your account.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Packs &amp; Other Products
          </h3>
          <ul className={LIST_CLASS}>
            <li>
              After topping up, you can purchase products available on the
              Website. The purchase price is instantly debited, and a visual
              animation signifies the action; the animation may not reflect the
              actual revealed item.
            </li>
            <li>
              Pricing details are displayed at the moment of acquisition for all
              products and services.
            </li>
            <li>
              Images of prizes are illustrative; actual items and packaging may
              vary.
            </li>
            <li>
              By purchasing products you may receive XP, items with fair market
              value equal to or greater than the pack price, or a combination of
              both.
            </li>
            <li>All transactions are irrevocable and non-refundable.</li>
          </ul>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            EXPERIENCE POINTS (XP) &amp; FREE PACKS
          </h2>
          <h3 className="text-sm font-bold mt-6 text-white">
            What are Experience Points?
          </h3>
          <p>
            XP allows customers to level up and gain access to free packs on a
            daily basis. XP cannot be converted into prizes or transferred to
            other users.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">How do I win XP?</h3>
          <ul className={LIST_CLASS}>
            <li>
              By buying packs—each purchase grants a specific amount of XP.
            </li>
            <li>
              By receiving XP as the content of a pack—XP is automatically added
              to your account.
            </li>
          </ul>

          <h3 className="text-sm font-bold mt-6 text-white">Free Packs</h3>
          <p>
            Free packs are earned by leveling up and may contain higher-value
            items. When you win a free pack it automatically appears in your
            account.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            PACKS &amp; PRIZES
          </h2>
          <ul className={LIST_CLASS}>
            <li>
              Pack images are visual aids and may not be definitive depictions.
            </li>
            <li>
              Items included in packs are listed on the Website beneath each
              pack.
            </li>
            <li>
              Item values correspond to the value at the time you redeem,
              exchange, or dispose of the item—not at the time of acquisition.
            </li>
            <li>Items cannot be changed, sold, or offered to other users.</li>
          </ul>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            PRIZE REDEMPTION
          </h2>
          <h3 className="text-sm font-bold mt-6 text-white">Redemption</h3>
          <p>
            You can redeem prizes by selecting the redemption option in your
            account. All items are subject to stock availability. If an item
            cannot be obtained, is modified, or supply is temporarily suspended,
            we may terminate the redemption process and provide a refund for the
            corresponding amount or item.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">Identification</h3>
          <p>
            To redeem a prize you must complete account verification, including
            providing name, address, identification document, proof of address,
            and any additional information we deem relevant. Failure to provide
            the requested information may result in termination or delay of the
            redemption process.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Delivery and Fees
          </h3>
          <p>
            Delivery costs (excluding customs, duties, or importation fees) are
            displayed during redemption. You are responsible for delivery and
            importation fees. Delivery typically occurs within three (3) to
            thirty (30) days once fees are paid and information is provided.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Collecting Luxury Items
          </h3>
          <p>
            Some luxury items may be collection-only; the description will state
            the collection point. We will not deliver collection-only items.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">Delays</h3>
          <p>
            If supply is delayed by an event outside our control, we will notify
            you and minimize the delay. We are not liable for such delays, but
            you may end the contract and receive a refund for items redeemed but
            not received if there is substantial delay.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Failure to Accept Delivery
          </h3>
          <p>
            If you are not home upon delivery, you may receive instructions to
            rearrange delivery or collect from a local depot. Failure to do so
            may result in a refund being issued instead of delivery.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Items Lost or Damaged
          </h3>
          <p>
            If items are lost during delivery, email{' '}
            <Link
              href="mailto:support@Flamedraw.com"
              className="text-blue-400 underline"
            >
              support@Flamedraw.com
            </Link>{' '}
            with proof of non-shipment. For damaged or faulty items, email{' '}
            <Link
              href="mailto:support@hypedrop.com"
              className="text-blue-400 underline"
            >
              support@hypedrop.com
            </Link>
            ; we may require you to return the item before issuing a refund.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            ITEMS EXCHANGE
          </h2>
          <p>
            If you do not want to redeem a prize, you may exchange it for the
            value displayed on the Website. The value will be credited to your
            account balance and can be redeemed to your cryptocurrency wallet.
            You are solely responsible for providing a valid wallet address.
          </p>
          <p>
            We may set and adjust minimum amounts for item exchange, and we
            reserve the right to perform enhanced due diligence before
            processing redemptions. We may refuse redemptions until your
            identity has been fully verified and additional requested
            information is provided.
          </p>
          <p>
            If we mistakenly credit your account with prizes that do not belong
            to you, the prize remains our property. Incorrect credits constitute
            a debt owed to us and may be deducted from your balance. Notify us
            immediately of any incorrect credits.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            SOFTWARE &amp; ERRORS
          </h2>
          <p>
            Some services may require you to download software or accept third
            party terms. We are not liable for third party software. You may use
            provided software solely for using products on the Website and may
            not copy, translate, reverse engineer, or modify the software except
            as permitted by law.
          </p>
          <p>
            You do not own the software; it remains the property of Flamedraw or
            the software provider and is protected by copyright law. The
            software is provided “as is” without warranties. We are not liable
            for system errors, interruptions, or viruses, and we may remove
            products or take corrective action in the event of errors.
          </p>
          <p>
            Misusing the Website by introducing malicious code or attacking our
            infrastructure is strictly prohibited. We are not liable for losses
            resulting from denial-of-service attacks or harmful material.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            YOUR EQUIPMENT
          </h2>
          <p>
            Your computer or mobile device and internet connection may affect
            Website performance. We do not guarantee fault-free operation and
            are not liable for failures due to your equipment or service
            provider. Mobile experiences may differ slightly due to limited
            display sizes.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            BONUS &amp; PROMOTIONS
          </h2>
          <p>
            We may offer bonuses and promotions at our discretion. These offers
            are governed by the Bonus and Promotions Policy and specific
            conditions. If we suspect bonus abuse, we may prohibit participation
            and remove eligibility.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            LAW ENFORCEMENT
          </h2>
          <p>
            We comply with requests from authorities or courts regarding users
            violating these Terms, per our privacy policies and applicable laws.
            If your activity causes Flamedraw to incur legal expenses to comply
            with orders, you agree to reimburse those expenses upon request.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            DISPUTE RESOLUTION AND DAMAGES
          </h2>
          <p>
            These Terms and any disputes arising from them are governed by the
            laws of Curaçao. You agree to first contact our Support Team to
            resolve disputes. If unresolved within 30 days, you agree to pursue
            arbitration under Curaçao law before initiating litigation.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            INDEMNIFICATION
          </h2>
          <p>
            You agree to defend, indemnify, and hold Flamedraw, its affiliates,
            officers, directors, employees, contractors, and agents harmless
            from any claims, actions, losses, liabilities, expenses, and costs
            arising from your actions or those of anyone using your Account,
            including government claims and damages resulting from use or misuse
            of Flamedraw.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            LIMITATION OF LIABILITY
          </h2>
          <p>
            We are not liable for user-generated materials, offensive conduct,
            personal injury, property damage, unauthorized access, service
            interruptions, malicious code, incompatibilities, or claims related
            to identification from provided content. You release Flamedraw and
            its affiliates from all claims arising from your use of Flamedraw.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            INTELLECTUAL PROPERTY
          </h2>
          <p>
            Flamedraw and related marks are proprietary trademarks. Product and
            service names of other manufacturers may be trademarks of their
            respective owners. You may not use our marks without written
            consent. Except for user-generated materials, all materials on
            Flamedraw are our proprietary information protected by copyright law.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            AMENDMENT
          </h2>
          <p>
            We may unilaterally alter these Terms. Changes are enforceable upon
            posting, and the revised version supersedes prior versions unless
            stated otherwise.
          </p>

          <h2 className="text-base font-bold mt-8 mb-2 text-white">
            GENERAL
          </h2>
          <h3 className="text-sm font-bold mt-6 text-white">
            Entire Agreement
          </h3>
          <p>
            These Terms, along with legally binding notices or agreements on the
            Website, constitute the entire agreement between you and Flamedraw.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Policies of Our Service Providers
          </h3>
          <p>
            We may use third-party service providers. You agree to follow their
            policies where required. If conflicts arise, our policies prevail.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Assignment and Delegation
          </h3>
          <p>
            We may assign rights or delegate performance without notice. You may
            not assign or delegate obligations without our prior written
            consent.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">Severability</h3>
          <p>
            If any provision is invalid, illegal, or unenforceable, the
            remaining provisions remain in full force, provided the fundamental
            terms remain valid.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Cumulative Remedies
          </h3>
          <p>
            Remedies in these Terms are cumulative and not exclusive. Exercising
            one right does not preclude asserting others.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">Force Majeure</h3>
          <p>
            Flamedraw is not liable for failure to fulfill obligations due to
            circumstances beyond our control, including natural disasters, war,
            strikes, infrastructure failures, or unlawful acts by third parties.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">
            Authorization to Send Emails
          </h3>
          <p>
            You authorize us to send emails, advertisements, and notifications
            until you request removal from our mailing list. Such
            communications are not considered spam.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">Language</h3>
          <p>
            Translated versions of these Terms are provided for convenience. The
            original English Terms prevail in the event of dispute.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">No Waiver</h3>
          <p>
            Failure to enforce any provision does not constitute a waiver of
            that or any other provision. Invalid terms do not affect the
            remaining Terms.
          </p>

          <h3 className="text-sm font-bold mt-6 text-white">Headings</h3>
          <p>
            Headings are for convenience only and do not affect interpretation
            of these Terms.
          </p>
        </article>
      </section>
    </div>
  );
}

