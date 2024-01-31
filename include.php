<?

use Bitrix\Main\Loader;

Loader::includeModule("welpodron.core");

CJSCore::RegisterExt('welpodron.wishlist', [
    'js' => '/local/packages/welpodron.wishlist/iife/wishlist/index.js',
    'css' => '/local/packages/welpodron.wishlist/css/wishlist/style.css',
    'skip_core' => true,
    'rel' => ['welpodron.core.templater'],
]);

//! ОБЯЗАТЕЛЬНО

Loader::registerAutoLoadClasses(
    'welpodron.wishlist',
    [
        'Welpodron\Wishlist\Utils' => 'lib/utils/utils.php',
    ]
);
