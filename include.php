<?

use Bitrix\Main\Loader;

CJSCore::RegisterExt('welpodron.wishlist', [
    'js' => '/bitrix/js/welpodron.wishlist/script.js',
    'css' => '/bitrix/css/welpodron.wishlist/style.css',
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
