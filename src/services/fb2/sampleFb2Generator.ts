/**
 * Lumina Reader - Sample FictionBook (FB2) Generator
 * Generates an authentic valid FB2 XML book with epigraphs, poems,
 * footnotes, chapter sections, and embedded base64 cover image.
 */

export async function generateSampleFb2(): Promise<ArrayBuffer> {
  const coverBase64 = createSampleJpegBase64();

  const fb2Xml = `<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
  <description>
    <title-info>
      <genre>sf_space</genre>
      <author>
        <first-name>Arthur</first-name>
        <middle-name>Vane</middle-name>
        <last-name>Harrow</last-name>
      </author>
      <book-title>The Starfarer's Soliloquy</book-title>
      <annotation>
        <p>A meditative chronicle of humanity's quiet wanderings among the dead pulsars of the outer rim.</p>
      </annotation>
      <date>2026</date>
      <coverpage>
        <image l:href="#cover.jpg"/>
      </coverpage>
      <lang>en</lang>
    </title-info>
    <publish-info>
      <publisher>Lumina Classics</publisher>
      <year>2026</year>
      <isbn>978-1-59308-000-0</isbn>
    </publish-info>
  </description>
  <body>
    <section>
      <title>
        <p>Prologue: The Echo of Starlight</p>
      </title>
      <epigraph>
        <p>"In the grand amphitheater of the vacuum, silence is not the absence of sound, but the presence of eternity."</p>
        <text-author>Archivist Kaelen Thorne, Stardate 4102</text-author>
      </epigraph>
      <p>The interstellar survey vessel <em>Aethelgard</em> floated dormant in the shadow of a dying binary star. Sub-light thrusters were cold; life-support hummed in harmonic fifths.</p>
      <p>Captain Julian Vance stood by the panoramic observation bay, sipping bitter synthetic tea. Beyond the reinforced quartz pane, ribbons of ionized gas coiled like golden serpents across the dark expanse of space<a l:href="#note1" type="note">1</a>.</p>
      <empty-line/>
      <poem>
        <stanza>
          <v>Stars like embers in the frozen deep,</v>
          <v>Promises that mortal dreamers keep.</v>
          <v>Through the silent gulfs we drift away,</v>
          <v>Chasing the ghost of yesterday.</v>
        </stanza>
      </poem>
      <empty-line/>
      <p>He tapped the armrest console. The ship's navigation computer replied in its calm, unhurried cadence: <em>"Drift velocity normalized. All stellar waypoints verified."</em></p>
    </section>
    <section>
      <title>
        <p>Chapter I: Signal from the Abyss</p>
      </title>
      <epigraph>
        <p>"Every beacon is a lighthouse or a siren. The wise navigator knows which to heed."</p>
      </epigraph>
      <p>At 03:00 ship-time, the deep-frequency antenna array registered a harmonic anomaly. It was not cosmic background radiation, nor the erratic pulse of a neutron star.</p>
      <p>It was a structured sequence—repeating prime integers modulated onto an ultra-low frequency carrier wave<a l:href="#note2" type="note">2</a>.</p>
      <cite>
        <p>"The frequency of origin corresponds to the coordinates of the lost expedition ship Hyperion, presumed destroyed two centuries ago."</p>
      </cite>
      <p>Julian leaned forward, his heart quickening against his ribs. <strong>The Hyperion had not perished.</strong> It had simply crossed the threshold.</p>
    </section>
  </body>
  <body name="notes">
    <section id="note1">
      <title><p>1</p></title>
      <p>Ionized gas filaments within planetary nebulae often reach temperatures exceeding 10,000 Kelvin despite the vacuum around them.</p>
    </section>
    <section id="note2">
      <title><p>2</p></title>
      <p>The interstellar prime signal format was established under the Geneva Accord of 2188 as the standard emergency beacon beaconing cadence.</p>
    </section>
  </body>
  <binary id="cover.jpg" content-type="image/jpeg">${coverBase64}</binary>
</FictionBook>`;

  return new TextEncoder().encode(fb2Xml).buffer;
}

function createSampleJpegBase64(): string {
  // Minimal valid 64x64 JPEG image encoded as base64
  const bytes = [
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
    0xff, 0xdb, 0x00, 0x43, 0x00, ...new Array(64).fill(0x10),
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x40, 0x00, 0x40, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0x7f, 0xff, 0x00,
    0xff, 0xd9
  ];
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
