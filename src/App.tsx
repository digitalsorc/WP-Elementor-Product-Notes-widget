import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, FileCode, CheckCircle2, Copy } from 'lucide-react';

const PLUGIN_FILES = {
  'wc-product-notes-elementor.php': `<?php
/**
 * Plugin Name: WooCommerce Product Notes Elementor Widget
 * Description: Adds an Elementor widget for a frontend editable note field on single product pages. The note follows the product to the cart, checkout, and emails.
 * Version: 1.0.0
 * Author: AI Studio
 * Text Domain: wc-product-notes
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Register Elementor Widget
function wcpn_register_elementor_widget( $widgets_manager ) {
	require_once( __DIR__ . '/widgets/class-product-note-widget.php' );
	$widgets_manager->register( new \\Elementor_Product_Note_Widget() );
}
add_action( 'elementor/widgets/register', 'wcpn_register_elementor_widget' );

// Enqueue frontend scripts
function wcpn_enqueue_frontend_scripts() {
	wp_enqueue_script( 'wcpn-frontend', plugin_dir_url( __FILE__ ) . 'assets/js/frontend.js', [ 'jquery' ], '1.0.0', true );
}
add_action( 'wp_enqueue_scripts', 'wcpn_enqueue_frontend_scripts' );

// Add hidden field to WooCommerce Add to Cart form
function wcpn_add_hidden_note_field() {
	echo '<input type="hidden" name="wcpn_product_note" id="wcpn_product_note_hidden" value="" />';
}
add_action( 'woocommerce_before_add_to_cart_button', 'wcpn_add_hidden_note_field' );

// Add custom data to cart item
function wcpn_add_cart_item_data( $cart_item_data, $product_id, $variation_id ) {
	if ( isset( $_POST['wcpn_product_note'] ) && ! empty( $_POST['wcpn_product_note'] ) ) {
		$cart_item_data['wcpn_product_note'] = sanitize_textarea_field( $_POST['wcpn_product_note'] );
	}
	return $cart_item_data;
}
add_filter( 'woocommerce_add_cart_item_data', 'wcpn_add_cart_item_data', 10, 3 );

// Display custom data in cart and checkout
function wcpn_get_item_data( $item_data, $cart_item ) {
	if ( isset( $cart_item['wcpn_product_note'] ) ) {
		$item_data[] = array(
			'key'     => __( 'Product Note', 'wc-product-notes' ),
			'value'   => wc_clean( $cart_item['wcpn_product_note'] ),
			'display' => '',
		);
	}
	return $item_data;
}
add_filter( 'woocommerce_get_item_data', 'wcpn_get_item_data', 10, 2 );

// Save custom data to order items
function wcpn_add_item_meta( $item, $cart_item_key, $values, $order ) {
	if ( isset( $values['wcpn_product_note'] ) ) {
		$item->add_meta_data( __( 'Product Note', 'wc-product-notes' ), $values['wcpn_product_note'], true );
	}
}
add_action( 'woocommerce_checkout_create_order_line_item', 'wcpn_add_item_meta', 10, 4 );
`,
  'widgets/class-product-note-widget.php': `<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Elementor_Product_Note_Widget extends \\Elementor\\Widget_Base {

	public function get_name() {
		return 'product_note';
	}

	public function get_title() {
		return __( 'Product Note', 'wc-product-notes' );
	}

	public function get_icon() {
		return 'eicon-text-area';
	}

	public function get_categories() {
		return [ 'general', 'woocommerce-elements' ];
	}

	protected function register_controls() {
		$this->start_controls_section(
			'content_section',
			[
				'label' => __( 'Content', 'wc-product-notes' ),
				'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'note_label',
			[
				'label' => __( 'Label', 'wc-product-notes' ),
				'type' => \\Elementor\\Controls_Manager::TEXT,
				'default' => __( 'Add a note to your order', 'wc-product-notes' ),
			]
		);

		$this->add_control(
			'note_placeholder',
			[
				'label' => __( 'Placeholder', 'wc-product-notes' ),
				'type' => \\Elementor\\Controls_Manager::TEXT,
				'default' => __( 'Type your note here...', 'wc-product-notes' ),
			]
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		?>
		<div class="wcpn-product-note-wrapper">
			<?php if ( ! empty( $settings['note_label'] ) ) : ?>
				<label for="wcpn_product_note_visible" style="display:block; margin-bottom: 8px; font-weight: 600;"><?php echo esc_html( $settings['note_label'] ); ?></label>
			<?php endif; ?>
			<textarea id="wcpn_product_note_visible" class="wcpn-product-note-input" placeholder="<?php echo esc_attr( $settings['note_placeholder'] ); ?>" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
		</div>
		<?php
	}
}
`,
  'assets/js/frontend.js': `jQuery(document).ready(function($) {
    // When the visible note field changes, update the hidden field in the add to cart form
    $(document).on('input', '#wcpn_product_note_visible', function() {
        var noteValue = $(this).val();
        $('#wcpn_product_note_hidden').val(noteValue);
    });
});
`
};

export default function App() {
  const [activeFile, setActiveFile] = useState<keyof typeof PLUGIN_FILES>('wc-product-notes-elementor.php');
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    const zip = new JSZip();
    
    // Create the plugin folder structure
    const pluginFolder = zip.folder('wc-product-notes-elementor');
    if (!pluginFolder) return;

    // Add files to the zip
    Object.entries(PLUGIN_FILES).forEach(([path, content]) => {
      pluginFolder.file(path, content);
    });

    // Generate and download the zip
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'wc-product-notes-elementor.zip');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PLUGIN_FILES[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <div className="max-w-5xl mx-auto p-6 lg:p-12">
        <header className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 mb-4">
            WooCommerce Product Notes Plugin
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl">
            This plugin adds an Elementor widget that provides a frontend editable note field. 
            When placed on a single product page, customer notes are attached to the product and 
            follow it through the cart, checkout, and order emails.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex-1 flex overflow-x-auto">
              {(Object.keys(PLUGIN_FILES) as Array<keyof typeof PLUGIN_FILES>).map((file) => (
                <button
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeFile === file
                      ? 'border-indigo-500 text-indigo-600 bg-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  {file}
                </button>
              ))}
            </div>
            <div className="p-3 flex items-center gap-2 border-t sm:border-t-0 border-zinc-200">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                title="Copy current file"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Plugin .zip
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-900 overflow-x-auto">
            <pre className="text-sm font-mono text-zinc-300">
              <code>{PLUGIN_FILES[activeFile]}</code>
            </pre>
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-semibold">1</div>
            <h3 className="font-semibold text-lg mb-2">Download & Install</h3>
            <p className="text-zinc-600 text-sm">Click the download button above to get the plugin zip file. Upload it to your WordPress site via Plugins &gt; Add New &gt; Upload Plugin.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-semibold">2</div>
            <h3 className="font-semibold text-lg mb-2">Add the Widget</h3>
            <p className="text-zinc-600 text-sm">Open your Single Product template in Elementor. Search for "Product Note" and drag the widget onto the page, typically near the Add to Cart button.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 font-semibold">3</div>
            <h3 className="font-semibold text-lg mb-2">Test the Flow</h3>
            <p className="text-zinc-600 text-sm">Type a note on the frontend, add the product to the cart, and verify the note appears in the cart, checkout, and order details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
