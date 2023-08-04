<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Context;

$moduleId = 'welpodron.wishlist';

$arTabs = [
    [
        'DIV' => 'edit1',
        'TAB' => 'Настройки внешнего вида ответа',
        'TITLE' => 'Настройки внешнего вида ответа',
        'GROUPS' => [
            [
                'TITLE' => 'Настройки внешнего вида ответа',
                'OPTIONS' => [
                    [
                        'NAME' => 'SUCCESS_FILE',
                        'LABEL' => 'PHP файл-шаблон успешного ответа',
                        'VALUE' => Option::get($moduleId, 'SUCCESS_FILE'),
                        'TYPE' => 'file',
                    ],
                    [
                        'NAME' => 'ERROR_FILE',
                        'LABEL' => 'PHP файл-шаблон ответа с ошибкой',
                        'VALUE' => Option::get($moduleId, 'ERROR_FILE'),
                        'TYPE' => 'file',
                    ],
                    [
                        'LABEL' => 'Рекомендуется использовать PHP файл-шаблон успешного ответа. Если PHP файл-шаблон успешного ответа не задан, то будет использоваться содержимое успешного ответа по умолчанию',
                        'TYPE' => 'note'
                    ],
                    [
                        'NAME' => 'SUCCESS_CONTENT_DEFAULT',
                        'LABEL' => 'Содержимое успешного ответа по умолчанию',
                        'VALUE' => Option::get($moduleId, 'SUCCESS_CONTENT_DEFAULT'),
                        'TYPE' => 'editor',
                    ],
                    [
                        'LABEL' => 'Рекомендуется использовать PHP файл-шаблон ответа с ошибкой. Если PHP файл-шаблон ответа с ошибкой не задан, то будет использоваться содержимое ответа с ошибкой по умолчанию',
                        'TYPE' => 'note'
                    ],
                    [
                        'NAME' => 'ERROR_CONTENT_DEFAULT',
                        'LABEL' => 'Содержимое ответа с ошибкой по умолчанию',
                        'VALUE' => Option::get($moduleId, 'ERROR_CONTENT_DEFAULT'),
                        'TYPE' => 'editor',
                    ],
                ],
            ]
        ]
    ],
];

$request = Context::getCurrent()->getRequest();

if ($request->isPost() && $request['save'] && check_bitrix_sessid()) {
    foreach ($arTabs as $arTab) {
        foreach ($arTab['GROUPS'] as $arGroup) {
            foreach ($arGroup['OPTIONS'] as $arOption) {
                if ($arOption['TYPE'] == 'note') continue;

                $value = $request->getPost($arOption['NAME']);

                if ($arOption['TYPE'] == "checkbox" && $value != "Y") {
                    $value = "N";
                } elseif (is_array($value)) {
                    $value = implode(",", $value);
                } elseif ($value === null) {
                    $value = '';
                }

                Option::set($moduleId, $arOption['NAME'], $value);
            }
        }
    }

    LocalRedirect($APPLICATION->GetCurPage() . '?lang=' . LANGUAGE_ID . '&mid_menu=1&mid=' . urlencode($moduleId) .
        '&tabControl_active_tab=' . urlencode($request['tabControl_active_tab']));
}

$tabControl = new CAdminTabControl("tabControl", $arTabs, true, true);
?>

<form name=<?= str_replace('.', '_', $moduleId) ?> method='post'>
    <? $tabControl->Begin(); ?>
    <?= bitrix_sessid_post(); ?>
    <? foreach ($arTabs as $arTab) : ?>
        <? $tabControl->BeginNextTab(); ?>
        <? foreach ($arTab['GROUPS'] as $arGroup) : ?>
            <tr class="heading">
                <td colspan="2"><?= $arGroup['TITLE'] ?></td>
            </tr>
            <? foreach ($arGroup['OPTIONS'] as $arOption) : ?>
                <tr>
                    <td style="width: 40%;">
                        <? if ($arOption['TYPE'] != 'note') : ?>
                            <label for="<?= $arOption['NAME'] ?>">
                                <?= $arOption['LABEL'] ?>
                            </label>
                        <? endif ?>
                    </td>
                    <td>
                        <? if ($arOption['TYPE'] == 'note') : ?>
                            <div class="adm-info-message">
                                <?= $arOption['LABEL'] ?>
                            </div>
                        <? elseif ($arOption['TYPE'] == 'file') : ?>
                            <?
                            CAdminFileDialog::ShowScript(
                                array(
                                    "event" => str_replace('_', '', 'browsePath' . htmlspecialcharsbx($arOption['NAME'])),
                                    "arResultDest" => array("FORM_NAME" => str_replace('.', '_', $moduleId), "FORM_ELEMENT_NAME" => $arOption['NAME']),
                                    "arPath" => array("PATH" => GetDirPath($arOption['VALUE'])),
                                    "select" => 'F', // F - file only, D - folder only
                                    "operation" => 'O', // O - open, S - save
                                    "showUploadTab" => false,
                                    "showAddToMenuTab" => false,
                                    "fileFilter" => 'php',
                                    "allowAllFiles" => true,
                                    "SaveConfig" => true,
                                )
                            );
                            ?>
                            <input type="text" id="<?= htmlspecialcharsbx($arOption['NAME']) ?>" name="<?= htmlspecialcharsbx($arOption['NAME']) ?>" size="80" maxlength="255" value="<?= htmlspecialcharsbx($arOption['VALUE']); ?>">&nbsp;<input type="button" name="<?= ('browse' . htmlspecialcharsbx($arOption['NAME'])) ?>" value="..." onClick="<?= (str_replace('_', '', 'browsePath' . htmlspecialcharsbx($arOption['NAME']))) ?>()">
                        <? elseif ($arOption['TYPE'] == 'editor') : ?>
                            <textarea id="<?= htmlspecialcharsbx($arOption['NAME']) ?>" rows="5" cols="80" name="<?= htmlspecialcharsbx($arOption['NAME']) ?>"><?= $arOption['VALUE'] ?></textarea>
                        <? else : ?>
                            <input id="<?= htmlspecialcharsbx($arOption['NAME']) ?>" name="<?= htmlspecialcharsbx($arOption['NAME']) ?>" type="text" size="80" maxlength="255" value="<?= $arOption['VALUE'] ?>">
                        <? endif; ?>
                    </td>
                </tr>
            <? endforeach; ?>
        <? endforeach; ?>
    <? endforeach; ?>
    <? $tabControl->Buttons(['btnApply' => false, 'btnCancel' => false, 'btnSaveAndAdd' => false]); ?>
    <? $tabControl->End(); ?>
</form>