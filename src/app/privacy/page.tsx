import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Lavender Moon Villas',
  description: 'Privacy Policy for Lavender Moon Villas - How we collect, use, and protect your personal data.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 6, 2026'
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-lavender-deep text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-lavender-pale hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif">Privacy Policy</h1>
          <p className="text-lavender-pale mt-2">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-8">
          
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">1. Introduction and Data Controller</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Lavender Moon Villas (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy and personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
              and make reservations at our property.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We comply with the Jamaican Data Protection Act and are committed to ensuring your data is handled responsibly.
            </p>
            <div className="bg-lavender-pale/30 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">Data Controller:</p>
              <p className="text-gray-700">Lavender Moon Villas</p>
              <p className="text-gray-700">Breadnut Hill, Ocho Rios</p>
              <p className="text-gray-700">St. Ann Parish, Jamaica</p>
              <p className="text-gray-700">Email: <a href="mailto:reservations@lavendermoon.net" className="text-lavender-deep hover:underline">reservations@lavendermoon.net</a></p>
              <p className="text-gray-700">Data Protection Inquiries: <a href="mailto:privacy@lavendermoon.net" className="text-lavender-deep hover:underline">privacy@lavendermoon.net</a></p>
            </div>
          </section>

          {/* 2. What Data We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">2. What Data We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect personal data that you voluntarily provide to us when making a reservation or contacting us. This includes:
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Guest Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Full name (first and last name)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Home address</li>
              <li>Identification type and number (for check-in verification)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Reservation Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Check-in and check-out dates</li>
              <li>Number of guests</li>
              <li>Room preferences</li>
              <li>Special requests or requirements</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Payment Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Payment card details (processed securely by our payment provider)</li>
              <li>Billing address</li>
              <li>Transaction records</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Technical Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited and time spent on our website</li>
            </ul>
          </section>

          {/* 3. How We Use Your Data */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">3. How We Use Your Data</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Reservation Processing:</strong> To process and manage your bookings, including confirmation emails and check-in/check-out procedures</li>
              <li><strong>Communication:</strong> To send you booking confirmations, updates, and important information about your stay</li>
              <li><strong>Payment Processing:</strong> To process payments for your reservations securely</li>
              <li><strong>Customer Service:</strong> To respond to your inquiries and provide support</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations, including tax and financial reporting requirements</li>
              <li><strong>Security:</strong> To maintain the security of our property and guests</li>
              <li><strong>Service Improvement:</strong> To improve our services and guest experience</li>
            </ul>
          </section>

          {/* 4. Legal Basis for Processing */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">4. Legal Basis for Processing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under the Jamaican Data Protection Act, we process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Contract Performance:</strong> Processing necessary to fulfill our contractual obligations when you make a reservation</li>
              <li><strong>Legitimate Interest:</strong> Processing necessary for our legitimate business interests, such as improving our services and preventing fraud</li>
              <li><strong>Legal Obligation:</strong> Processing required to comply with Jamaican laws and regulations</li>
              <li><strong>Consent:</strong> Where you have given explicit consent for specific processing activities</li>
            </ul>
          </section>

          {/* 5. Data Sharing and Third Parties */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">5. Data Sharing and Third Parties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We share your personal data with the following third-party service providers who assist us in operating our business:
            </p>
            
            <div className="space-y-4 mt-4">
              <div className="border-l-4 border-lavender-medium pl-4">
                <h3 className="font-medium text-gray-800">DimePay (Payment Processing)</h3>
                <p className="text-gray-600 text-sm">Processes payment card information securely. Your card details are transmitted directly to DimePay and are not stored on our servers.</p>
                <a href="https://dimepay.net/privacy" target="_blank" rel="noopener noreferrer" className="text-lavender-deep text-sm hover:underline">DimePay Privacy Policy →</a>
              </div>
              
              <div className="border-l-4 border-lavender-medium pl-4">
                <h3 className="font-medium text-gray-800">Resend (Email Service)</h3>
                <p className="text-gray-600 text-sm">Sends transactional emails including booking confirmations and updates. Receives your email address and name.</p>
                <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-lavender-deep text-sm hover:underline">Resend Privacy Policy →</a>
              </div>
              
              <div className="border-l-4 border-lavender-medium pl-4">
                <h3 className="font-medium text-gray-800">Neon (Database Hosting)</h3>
                <p className="text-gray-600 text-sm">Securely stores our database containing guest and reservation information in cloud infrastructure.</p>
                <a href="https://neon.tech/privacy" target="_blank" rel="noopener noreferrer" className="text-lavender-deep text-sm hover:underline">Neon Privacy Policy →</a>
              </div>
              
              <div className="border-l-4 border-lavender-medium pl-4">
                <h3 className="font-medium text-gray-800">Vercel (Website Hosting)</h3>
                <p className="text-gray-600 text-sm">Hosts our website and may process technical data such as IP addresses and access logs.</p>
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-lavender-deep text-sm hover:underline">Vercel Privacy Policy →</a>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-6">
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </section>

          {/* 6. Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Reservation Records:</strong> Retained for 7 years from the date of check-out for legal and financial compliance purposes</li>
              <li><strong>Guest Information:</strong> Retained for 7 years from your last stay, after which it may be anonymized or deleted</li>
              <li><strong>Payment Records:</strong> Retained for 7 years as required by tax and financial regulations</li>
              <li><strong>Communication Records:</strong> Retained for 3 years unless needed for legal purposes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              After the retention period, your data will be securely deleted or anonymized so that it can no longer be associated with you.
            </p>
          </section>

          {/* 7. Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under the Jamaican Data Protection Act, you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Right of Access:</strong> You can request a copy of the personal data we hold about you</li>
              <li><strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete personal data</li>
              <li><strong>Right to Deletion:</strong> You can request deletion of your personal data, subject to legal retention requirements</li>
              <li><strong>Right to Object:</strong> You can object to certain types of processing, including direct marketing</li>
              <li><strong>Right to Data Portability:</strong> You can request your data in a structured, machine-readable format</li>
              <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you can withdraw it at any time</li>
            </ul>
            
            <div className="bg-lavender-pale/30 p-4 rounded-lg mt-6">
              <p className="text-gray-700 font-medium mb-2">To Exercise Your Rights:</p>
              <p className="text-gray-700 mb-2">
                You can manage your data through our <Link href="/my-reservation" className="text-lavender-deep hover:underline">My Reservation</Link> portal, 
                or contact us directly at <a href="mailto:privacy@lavendermoon.net" className="text-lavender-deep hover:underline">privacy@lavendermoon.net</a>.
              </p>
              <p className="text-gray-700">
                We will respond to your request within 30 days. We may need to verify your identity before processing your request.
              </p>
            </div>
          </section>

          {/* 8. Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">8. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, 
              alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Encryption:</strong> All data transmitted between your browser and our servers is encrypted using SSL/TLS</li>
              <li><strong>Secure Storage:</strong> Personal data is stored in secure, access-controlled database systems</li>
              <li><strong>Password Protection:</strong> Staff accounts are protected with strong, hashed passwords</li>
              <li><strong>Access Controls:</strong> Only authorized personnel can access personal data on a need-to-know basis</li>
              <li><strong>Regular Updates:</strong> We keep our systems and software updated with security patches</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              While we strive to protect your personal data, no method of transmission over the Internet is 100% secure. 
              We cannot guarantee absolute security but will notify you promptly in the event of a data breach.
            </p>
          </section>

          {/* 9. Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">9. Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our website uses cookies and similar technologies to enhance your browsing experience. Cookies are small text files 
              stored on your device that help us provide and improve our services.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Types of Cookies We Use</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., session management, security)</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            </ul>
            
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookies through your browser settings. Disabling essential cookies may affect website functionality.
            </p>
          </section>

          {/* 10. International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your personal data may be transferred to and processed in countries outside Jamaica where our service providers 
              operate (e.g., United States for hosting services). When we transfer your data internationally, we ensure 
              appropriate safeguards are in place to protect your data in accordance with the Jamaican Data Protection Act.
            </p>
          </section>

          {/* 11. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal data 
              from children. If you are a parent or guardian and believe we have collected information from a child, 
              please contact us immediately at <a href="mailto:privacy@lavendermoon.net" className="text-lavender-deep hover:underline">privacy@lavendermoon.net</a>.
            </p>
          </section>

          {/* 12. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by posting the updated policy on our website with a new &quot;Last Updated&quot; date. 
              We encourage you to review this policy periodically.
            </p>
          </section>

          {/* 13. Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-lavender-pale/30 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Lavender Moon Villas</strong></p>
              <p className="text-gray-700">Breadnut Hill, Ocho Rios</p>
              <p className="text-gray-700">St. Ann Parish, Jamaica</p>
              <p className="text-gray-700 mt-2">
                <strong>General Inquiries:</strong>{' '}
                <a href="mailto:reservations@lavendermoon.net" className="text-lavender-deep hover:underline">reservations@lavendermoon.net</a>
              </p>
              <p className="text-gray-700">
                <strong>Data Protection:</strong>{' '}
                <a href="mailto:privacy@lavendermoon.net" className="text-lavender-deep hover:underline">privacy@lavendermoon.net</a>
              </p>
            </div>
          </section>

          {/* 14. Complaints */}
          <section>
            <h2 className="text-2xl font-semibold text-lavender-deep mb-4">14. Right to Lodge a Complaint</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you believe we have not handled your personal data properly, you have the right to lodge a complaint with 
              the Office of the Information Commissioner of Jamaica:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Office of the Information Commissioner</strong></p>
              <p className="text-gray-700">Kingston, Jamaica</p>
              <p className="text-gray-700">Website: <a href="https://oic.gov.jm" target="_blank" rel="noopener noreferrer" className="text-lavender-deep hover:underline">oic.gov.jm</a></p>
            </div>
          </section>

        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-lavender-deep hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}

