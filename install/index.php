<?

use Bitrix\Main\ModuleManager;
use Bitrix\Main\Loader;
use Bitrix\Main\Application;
use Bitrix\Main\IO\Directory;

class welpodron_wishlist extends CModule
{

    public function __construct()
    {
        $this->MODULE_ID = 'welpodron.wishlist';
        $this->MODULE_VERSION = '2.0.0';
        $this->MODULE_NAME = 'Избранные товары (welpodron.wishlist)';
        $this->MODULE_DESCRIPTION = 'Модуль для работы с избранными товарами';
        $this->PARTNER_NAME = 'Welpodron';
        $this->PARTNER_URI = 'https://github.com/Welpodron';
    }

    public function InstallFiles()
    {
        global $APPLICATION;

        try {
            if (!CopyDirFiles(__DIR__ . '/js/', Application::getDocumentRoot() . '/bitrix/js', true, true)) {
                $APPLICATION->ThrowException('Не удалось скопировать js');
                return false;
            };
            if (!CopyDirFiles(__DIR__ . '/css/', Application::getDocumentRoot() . '/bitrix/css', true, true)) {
                $APPLICATION->ThrowException('Не удалось скопировать css');
                return false;
            };
        } catch (\Throwable $th) {
            $APPLICATION->ThrowException($th->getMessage() . '\n' . $th->getTraceAsString());
            return false;
        }

        return true;
    }

    public function UnInstallFiles()
    {
        Directory::deleteDirectory(Application::getDocumentRoot() . '/bitrix/js/' . $this->MODULE_ID);
        Directory::deleteDirectory(Application::getDocumentRoot() . '/bitrix/css/' . $this->MODULE_ID);
    }

    public function DoInstall()
    {
        global $APPLICATION;

        if (!CheckVersion(ModuleManager::getVersion('main'), '14.00.00')) {
            $APPLICATION->ThrowException('Версия главного модуля ниже 14.00.00');
            return false;
        }

        if (!Loader::includeModule("catalog")) {
            $APPLICATION->ThrowException('Модуль catalog не был найден');
            return false;
        }


        if (!Loader::includeModule("sale")) {
            $APPLICATION->ThrowException('Модуль sale не был найден');
            return false;
        }

        if (!$this->InstallFiles()) {
            return false;
        }

        ModuleManager::registerModule($this->MODULE_ID);

        $APPLICATION->IncludeAdminFile('Установка модуля ' . $this->MODULE_ID, __DIR__ . '/step.php');
    }

    public function DoUninstall()
    {
        global $APPLICATION;

        $this->UnInstallFiles();

        ModuleManager::unRegisterModule($this->MODULE_ID);

        $APPLICATION->IncludeAdminFile('Деинсталляция модуля ' . $this->MODULE_ID, __DIR__ . '/unstep.php');
    }
}