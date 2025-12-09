'use client';

import Link from 'next/link';

const CONTAINER_CLASS =
  'flex mx-auto px-4 py-8 pb-48 max-w-4xl text-white';

const SECTION_CLASS =
  'bg-white/0 text-white/90 leading-relaxed text-sm [&_p]:mb-4 [&_p]:text-justify';

const listClass =
  'list-disc pl-6 space-y-3 text-justify';

export default function PrivacyPolicyPage() {
  return (
    <div className={CONTAINER_CLASS}>
      <section className={SECTION_CLASS}>
        <article>
           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            INTRODUCTION
          </h2>
          <p>
            This Privacy Policy sets out how FlameDraw will manage your personal data,
            which will be collected as a result of your use of our services and the website
            or any other pages under the FlameDraw brand including any electrical device
            or app that are owned and/or operated by us. FlameDraw is committed to
            ensuring that the personal data we collect about you is protected and is
            used, stored and disclosed in accordance with the applicable regulation.
            For your information, your personal data will be collected by:
          </p>
          <p>
            FD Operations B.V., a company duly incorporated under the laws of
            Curaçao with Company number 171219, and registered office at
            Korporaalweg 10, Curaçao.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            CONSENT
          </h2>
          <p>
            By accessing <span className="underline">www.flamedraw.com</span> or
            registering an account at the website, you consent for FlameDraw to collect,
            use, process and disclose your personal information with third party
            providers and other entities of FlameDraw’s group, as long as such
            information is essential for the provision of the services that you are
            using on the website.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            WHAT DATA DO WE COLLECT?
          </h2>
          <p>When using our services we collect the following data:</p>
          <ul className={listClass}>
            <li>
              <span className="font-bold">Personal Data:</span>{' '}
              Full Name, Date of Birth, Country of Citizenship, Permanent Address,
              Identification Document, Utility Bill, Phone Number and Email Address.
            </li>
            <li>
              <span className="font-bold">Usage Data:</span>{' '}
              Location Data, Device Information, IP Address, Submitted Preferences,
              browser type and browser version.
            </li>
            <li>
              <span className="font-bold">Public Data:</span>{' '}
              Social media profile you might use on our platform such as Facebook,
              Twitter, TikTok and Instagram.
            </li>
          </ul>
          <p>
            During the use of the services, you might be requested to provide additional
            personal information. In such event you will be informed of the purpose of
            such collection and the collected information will be treated in accordance
            with this Policy.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            HOW DO WE COLLECT YOUR DATA?
          </h2>
          <p>We collect your personal data through the following means:</p>
          <ul className={listClass}>
            <li>Registration on the website;</li>
            <li>Use of the website and our services;</li>
            <li>Communications with Support Team;</li>
            <li>Use of Cookies (please view our Cookies Policy for further information);</li>
            <li>Participation on campaigns and promotions;</li>
            <li>Through third parties that you have authorised to share your personal information with us.</li>
          </ul>
          <p>
            If you do not provide us with the personal data we request, we may be
            unable to process your registration and provide you with our services
            or respond to your enquiries or complaints.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            HOW WILL WE USE YOUR DATA?
          </h2>
          <p>
            We collect your personal data only through lawful means and in respect
            for the applicable regulation, for the following purpose:
          </p>
          <ul className={listClass}>
            <li>Register and operate your account;</li>
            <li>Provide services to you;</li>
            <li>Improve and enhance your experience in the website;</li>
            <li>Conduct marketing campaigns and promotions;</li>
            <li>Send you marketing communications that we think may be of interest to you;</li>
            <li>Perform marketing research and data analysis to improve our services;</li>
            <li>Provide you support and clarify your questions, doubts or comments;</li>
            <li>Identify you (Know Your Customer);</li>
            <li>Establish, exercise or defend against any legal claims;</li>
            <li>Comply with legal requirements and requests.</li>
          </ul>
          <p>
            If you have any doubts regarding the purpose of the collection of any personal data,
            please contact our Support Team.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            FOR HOW LONG DO WE STORE YOUR DATA?
          </h2>
          <p>
            We will store your data in accordance with the applicable regulation and the purpose
            that the same was collected for. Depending on the purpose, the retention period may
            change. For example, for compliance with anti-money laundering regulation, we need to
            store your data for 5 years after you close your account.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            SECURITY OF YOUR PERSONAL DATA
          </h2>
          <p>
            We acknowledge that through collecting and processing your personal information for
            the purposes of providing services to you, we are bound by the applicable data
            protection regulation. Accordingly, we will take all reasonable steps to ensure that
            your personal information is stored in a secure environment which is accessed only by
            authorised persons.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            MARKETING CONSENT
          </h2>
          <p>
            If you have given your consent, we will use your personal data to inform you about
            our products, services, campaigns, promotions and other FlameDraw activities that
            might benefit you. If you no longer wish to receive marketing communications, please
            contact our Support Team or press the “unsubscribe” button on the marketing e-mails.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">COOKIES</h2>
          <p>
            We might collect Cookies that contain personal information. Such Cookies will be
            treated in accordance with this Policy. For more information about Cookies,
            please view our Cookies Policy.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            YOUR RIGHTS
          </h2>
          <p>Under this Policy you have the right to:</p>
          <ul className={listClass}>
            <li><span className="font-bold">Access</span> – request copies of your personal data.</li>
            <li><span className="font-bold">Rectify</span> – request correction of inaccurate or incomplete data.</li>
            <li><span className="font-bold">Erase</span> – request deletion of your personal data under certain conditions.</li>
            <li><span className="font-bold">Restrict</span> – request restriction of processing, where compatible with service provision.</li>
            <li><span className="font-bold">Object</span> – object to processing, where compatible with service provision.</li>
            <li><span className="font-bold">Portability</span> – request transfer of your personal data to another organization or to you.</li>
          </ul>
          <p>
            All the rights mentioned above can be exercised through contacting our Support Team.
            Please note that we may ask you to verify your identity before responding.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">DATA TRANSFER</h2>
          <p>
            As a worldwide business we might need to transfer your data to other countries in
            order to provide the services you use on the website. When transferring your personal
            data we will make best efforts to ensure compliance with applicable regulations and
            that equivalent obligations are imposed on processors.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            SHARING YOUR DATA WITH THIRD PARTIES
          </h2>
          <p>
            We do not sell or rent your personal data to third parties. However, we may disclose
            your personal information in the following cases:
          </p>
          <ul className={listClass}>
            <li>If imposed by law or requested by any government authority;</li>
            <li>If necessary for the provision of the services and products you use on the website;</li>
            <li>To comply with legal and regulatory duties and responsibilities;</li>
            <li>To any third parties to which you have provided your consent.</li>
          </ul>
          <p>
            Please note our website and products may contain links that redirect you to third party
            websites. We are not responsible for such external content, which may contain separate
            privacy policies and data processing disclosures.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">CONTACTS</h2>
          <p>
            If you have any questions regarding this policy, please contact us via email at{' '}
            <Link href="mailto:support@flamedraw.com" className="text-blue-400 underline">
              support@flamedraw.com
            </Link>.
          </p>

           <h2 className="text-base font-bold mt-8 mb-2 text-white">
            APPROVAL &amp; REVIEW
          </h2>
          <p>
            This Policy was reviewed and approved by the Executive Committee of FlameDraw.
            It will be reviewed on an annual basis or whenever regulatory or internal
            procedure changes impact the same.
          </p>
        </article>
      </section>
    </div>
  );
}

