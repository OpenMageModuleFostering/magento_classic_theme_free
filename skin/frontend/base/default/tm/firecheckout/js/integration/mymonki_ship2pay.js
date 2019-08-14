/**
 * Fix for module logic, because it does not remove payment method actually
 * and firecheckout left payment fee in totals for hidden method.
 *
 * The true way is to override Mage::helper('payment')::getStoreMethods method
 * instead of Mage_Checkout_Block_Onepage_Payment_Methods::getMethods
 */
document.observe('firecheckout:paymentMethod:afterInitAfter', function() {
    // @see payemnt::afterInit
    if (payment.paymentOutdatedFlag && typeof checkout !== 'undefined') {
        var sections = FireCheckout.Ajax.getSectionsToUpdate('payment-method');
        if (sections.length) {
            sections.push('payment[remove]');
            checkout.update(
                checkout.urls.payment_method,
                FireCheckout.Ajax.arrayToJson(sections)
            );
        }
    }
});
