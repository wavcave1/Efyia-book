import SectionHeading from '../components/SectionHeading';

export default function ContactPage() {
  return (
    <div className="page page--narrow">
      <section className="page-hero page-hero--contact">
        <SectionHeading
          eyebrow="Contact"
          title="Questions before you book? Reach out directly."
          description=""
        />
        <div className="contact-actions">
          <a className="button button--primary" href="mailto:wavcavemgmt@thewavcave.com">Email the studio</a>
          <a className="button button--secondary" href="tel:6153920323">Call or text</a>
          <a className="button button--ghost" href="/booking.html">Go to booking</a>
        </div>
      </section>

      <section className="contact-layout">
        <article className="contact-card">
          <h3>Studio details</h3>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:wavcavemgmt@thewavcave.com">wavcavemgmt@thewavcave.com</a></li>
            <li><strong>Phone:</strong> <a href="tel:6153920323">615-392-0323</a></li>
            
          </ul>
        </article>

        <article className="contact-card contact-card--form">
          <h3>Studio inquiry</h3>
          <form
            className="inquiry-form"
            action="https://forms.zohopublic.com/wavcavemgmtthewa1/form/StudioInquiry/formperma/uOCQcMWIC4K2El2UQN-tYYZarx_aBK7TeYB4Ck2mf4M/htmlRecords/submit"
            name="form"
            id="form"
            method="POST"
            acceptCharset="UTF-8"
            encType="multipart/form-data"
          >
            <input type="hidden" name="zf_referrer_name" value="" />
            <input type="hidden" name="zf_redirect_url" value="" />
            <input type="hidden" name="zc_gad" value="" />

            <label htmlFor="first">First Name</label>
            <input type="text" name="Name_First" id="first" maxLength="255" required />

            <label htmlFor="last">Last Name</label>
            <input type="text" name="Name_Last" id="last" maxLength="255" required />

            <label htmlFor="phone">Phone Number</label>
            <input type="text" name="PhoneNumber_countrycode" id="phone" maxLength="20" />

            <label htmlFor="email">Email</label>
            <input type="email" name="Email" id="email" maxLength="255" required />

            <button type="submit" className="button button--primary button--full">Submit inquiry</button>
          </form>
        </article>
      </section>
    </div>
  );
}
