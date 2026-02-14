// vite-plugin-source.ts
import { Plugin } from 'vite'
import { transformAsync } from '@babel/core'
import jsxSyntax from '@babel/plugin-syntax-jsx'
import path from 'path'

export default function agentationLocatorPlugin(): Plugin {
    return {
        name: 'vite-plugin-agentation-locator',
        enforce: 'pre',

        // ⚠️ Only apply in serve mode (dev)
        apply: 'serve',

        async transform(code, id) {
            // Only process .tsx / .jsx files and exclude node_modules
            if (!/\.(t|j)sx?$/.test(id) || id.includes('node_modules')) return null

            // Relative path for display
            const filename = path.relative(process.cwd(), id)

            const result = await transformAsync(code, {
                filename,
                parserOpts: {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript'],
                },
                plugins: [
                    jsxSyntax,
                    function injectSource() {
                        return {
                            visitor: {
                                JSXOpeningElement(path: any) {
                                    // Ignore Fragment
                                    if (path.node.name.name === 'Fragment') return

                                    // Avoid duplicate injection
                                    const hasAttr = path.node.attributes.some(
                                        (attr: any) => attr.name?.name === 'data-agentation-location'
                                    )
                                    if (hasAttr) return

                                    // Inject data-agentation-location attribute
                                    path.node.attributes.push({
                                        type: 'JSXAttribute',
                                        name: { type: 'JSXIdentifier', name: 'data-agentation-location' },
                                        value: {
                                            type: 'StringLiteral',
                                            value: `${filename}:${path.node.loc?.start.line || 0}:${path.node.loc?.start.column || 0}`,
                                        },
                                    })
                                },
                            },
                        }
                    },
                ],
                generatorOpts: {
                    jsescOption: { minimal: true },
                },
                sourceMaps: true, // Generate source map
            })

            if (!result?.code) return null

            return {
                code: result.code,
                map: result.map, // Return source map to Vite
            }
        },
    }
}