<?

namespace Welpodron\Wishlist\Controller;

use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Error;
use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Main\Web\Cookie;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Config\Option;

use Welpodron\Wishlist\Utils;

class Receiver extends Controller
{
    const DEFAULT_MODULE_ID = 'welpodron.wishlist';
    const DEFAULT_COOKIE_CODE = "WISHLIST";

    public function configureActions()
    {
        return [
            'toggle' => [
                'prefilters' => [],
            ],
        ];
    }

    protected function addCookie($code = self::DEFAULT_COOKIE_CODE, $value)
    {
        $cookie = new Cookie($code, Json::encode($value));

        $response = Context::getCurrent()->getResponse();
        $response->addCookie($cookie);
    }

    // welpodron:wishlist.Receiver.toggle
    public function toggleAction()
    {
        global $APPLICATION;

        try {
            if (!Loader::includeModule(self::DEFAULT_MODULE_ID)) {
                throw new \Exception('Модуль ' . self::DEFAULT_MODULE_ID . ' не удалось подключить');
            }

            if (!Loader::includeModule("catalog")) {
                throw new \Exception('Модуль catalog не удалось подключить');
            }


            if (!Loader::includeModule("sale")) {
                throw new \Exception('Модуль sale не удалось подключить');
            }

            $request = $this->getRequest();
            $arDataRaw = $request->getPostList()->toArray();

            // Данные должны содержать идентификатор сессии битрикса 
            if ($arDataRaw['sessid'] !== bitrix_sessid()) {
                throw new \Exception('Неверный идентификатор сессии');
            }

            $id = intval($arDataRaw['product_id']);

            $wishlisted = false;

            if ($id <= 0) {
                throw new \Exception('Неверный ID');
            }

            $wishlist = Utils::getWishlist(self::DEFAULT_COOKIE_CODE);

            $key = array_search($id, $wishlist);

            if ($key !== false) {
                unset($wishlist[$key]);
                $wishlisted = false;
            } else {
                $wishlist[] = $id;
                $wishlisted = true;
            }

            $templateIncludeResult =  Option::get(self::DEFAULT_MODULE_ID, 'SUCCESS_CONTENT_DEFAULT');

            $successFile = Option::get(self::DEFAULT_MODULE_ID, 'SUCCESS_FILE');

            if ($successFile) {
                ob_start();
                $APPLICATION->IncludeFile($successFile, [], ["SHOW_BORDER" => false, "MODE" => "php"]);
                $templateIncludeResult = ob_get_contents();
                ob_end_clean();
            }

            $this->addCookie(self::DEFAULT_COOKIE_CODE, $wishlist);

            return [
                'HTML' => $templateIncludeResult,
                'PRODUCT_ID' => $id,
                'IN_WISHLIST' => $wishlisted,
                'WISHLIST_COUNTER' => count($wishlist),
            ];
        } catch (\Throwable $th) {
            if (CurrentUser::get()->isAdmin()) {
                $this->addError(new Error($th->getMessage(), $th->getCode()));
                return;
            }

            try {
                $errorFile = Option::get(self::DEFAULT_MODULE_ID, 'ERROR_FILE');

                if (!$errorFile) {
                    $this->addError(new Error(Option::get(self::DEFAULT_MODULE_ID, 'ERROR_CONTENT_DEFAULT')));
                    return;
                }

                ob_start();
                $APPLICATION->IncludeFile($errorFile, [], ["SHOW_BORDER" => false, "MODE" => "php"]);
                $templateIncludeResult = ob_get_contents();
                ob_end_clean();
                $this->addError(new Error($templateIncludeResult));
                return;
            } catch (\Throwable $th) {
                if (CurrentUser::get()->isAdmin()) {
                    $this->addError(new Error($th->getMessage(), $th->getCode()));
                    return;
                } else {
                    $this->addError(new Error(Option::get(self::DEFAULT_MODULE_ID, 'ERROR_CONTENT_DEFAULT')));
                    return;
                }
            }
        }
    }
}
