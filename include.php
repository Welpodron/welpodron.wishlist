<?

use Bitrix\Main\Loader;

CJSCore::RegisterExt('welpodron.wishlist', [
    'js' => '/local/packages/welpodron.feedback/iife/wishlist/index.js',
    'css' => '/local/packages/welpodron.feedback/css/wishlist/style.css',
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
