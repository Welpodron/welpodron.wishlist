<?

namespace Welpodron\Wishlist;

use Bitrix\Main\Context;
use Bitrix\Main\Web\Json;

class Utils
{
    const DEFAULT_COOKIE_CODE = "WISHLIST";

    static public function getWishlist($cookieCode = self::DEFAULT_COOKIE_CODE)
    {
        $wishlist = Context::getCurrent()->getRequest()->getCookie($cookieCode);

        if (isset($wishlist) && !empty($wishlist)) {
            try {
                $wishlist = Json::decode($wishlist);

                if (is_array($wishlist)) {
                    return $wishlist;
                }
            } catch (\Throwable $th) {
            }
        }

        return [];
    }
}
