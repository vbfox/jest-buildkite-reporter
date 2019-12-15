export type SupportedColor = 'red' | 'green' | 'yellow' | 'lightgrey';

export class MarkdownBuilder {
    private text: string = '';

    append(s: string) {
        this.text += s;
    }

    appendLine(s?: string) {
        if (s) {
            this.text += s + '\n';
        } else {
            this.text += '\n';
        }
    }

    appendParagraphBreak() {
        this.text += '\n\n';
    }

    appendLineBreak() {
        this.text += '<br />\n';
    }

    appendColor(color: SupportedColor, s: string) {
        // Class names are a hack, Buildkite filter the <font> element
        // But they allow className and have a wide library of colors
        // in their terminal css renderer.
        let className;
        let colorValue;
        switch (color) {
            case 'red':
                className = 'term-fgx160';
                colorValue = '#d70000';
                break;
            case 'green':
                className = 'term-fgx70';
                colorValue = '#5faf00';
                break;
            case 'lightgrey':
                className = 'term-fgx250';
                colorValue = '#bcbcbc';
                break;
            case 'yellow':
                // Orange in fact, because yellow over white is unreadable
                className = 'term-fgx214';
                colorValue = '#ffaf00';
                break;
        }

        this.append(`<span class="${className}">`);        
        this.append(`<font color="${colorValue}">${s}</font>`);
        this.append(`</span>`);
    }

    appendColorIf(color: SupportedColor, s: string, condition: boolean) {
        if (condition) {
            this.appendColor(color, s);
        } else {
            this.append(s);
        }
    }

    appendCode(format:string, text: string, indent?: number) {
        const indentStr = indent === undefined ? '' : ' '.repeat(indent);
        this.appendLine();
        this.appendLine(indentStr + '```' + format);
        const lines = text.split('\n');
        for(const line of lines) {
            this.appendLine(indentStr + line);    
        }
        this.appendLine(indentStr + '```');
    }

    appendTerm(text: string, indent?: number) {
        this.appendCode('term', text, indent);
    }

    appendDetailsStart(summary: string) {
        this.appendLine(`<details><summary>${summary}</summary>`);
        this.appendLine();
    }

    appendDetailsEnd() {
        this.appendLine(`</details>`);
    }

    toString() {
        return this.text;
    }
}