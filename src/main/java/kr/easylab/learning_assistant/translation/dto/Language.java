package kr.easylab.learning_assistant.translation.dto;

public enum Language {
    ENGLISH("en"),
    KOREAN("ko"),
    SPANISH("es"),
    FRENCH("fr");

    private final String code;

    Language(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static Language fromCode(String code) {
        if (code == null) {
            return null;
        }

        for (Language language : Language.values()) {
            if (language.code.equalsIgnoreCase(code)) {
                return language;
            }
        }

        throw new IllegalArgumentException("Unknown language code: " + code);
    }
}
